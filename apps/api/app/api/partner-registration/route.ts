// app/api/partner-registration/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { sendPartnerRegistrationEmail } from "@/core/email-templates";

const generateApplicationId = () => {
  const date = new Date();

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  const random = Math.floor(10000 + Math.random() * 90000);

  return `APP-${y}${m}${d}-${random}`;
};

export async function POST(req: NextRequest) {
  const client = await pool.connect();

  try {
    const body = await req.json();

    const {
      kvk_number,
      company_name,
      chamber_of_commerce_number,
      country,
      street,
      house_number,
      additional_address,
      postal_code,
      city,
      chamberFiles,
      power_of_attorney_document,
      first_name,
      middle_name,
      last_name,
      business_phone_number,
      business_email_address,
      vat_number,
      idin,
    } = body;

    /* ---------------- VALIDATION ---------------- */

    if (!company_name) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 },
      );
    }

    if (!business_email_address) {
      return NextResponse.json(
        { error: "Business email is required" },
        { status: 400 },
      );
    }

    if (!chamberFiles || chamberFiles.length === 0) {
      return NextResponse.json(
        { error: "Chamber documents are required" },
        { status: 400 },
      );
    }

    /* ---------------- APPLICATION ID ---------------- */

    const application_id = generateApplicationId();

    /* ---------------- DUPLICATE CHECK ---------------- */

    const existing = await client.query(
      `
      SELECT partner_id
      FROM partner_registration
      WHERE kvk_number = $1
      LIMIT 1
      `,
      [kvk_number],
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        {
          error: "A registration with this KVK number already exists",
        },
        { status: 409 },
      );
    }

    /* ---------------- START TRANSACTION ---------------- */

    await client.query("BEGIN");

    /* ---------------- INSERT ---------------- */

    const result = await client.query(
      `
      INSERT INTO partner_registration (
        application_id,
        kvk_number,
        company_name,
        chamber_of_commerce_number,
        country,
        street,
        house_number,
        additional_address,
        postal_code,
        city,
        chamber_of_commerce_extract_document,
        power_of_attorney_document,
        first_name,
        middle_name,
        last_name,
        business_phone_number,
        business_email_address,
        vat_number,
        idin
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19
      )
      RETURNING *
      `,
      [
        application_id,
        kvk_number,
        company_name,
        chamber_of_commerce_number,
        country,
        street,
        house_number,
        additional_address,
        postal_code,
        city,
        chamberFiles || [],
        power_of_attorney_document || [],
        first_name,
        middle_name,
        last_name,
        business_phone_number,
        business_email_address,
        vat_number,
        idin || null,
      ],
    );

    

    /* ---------------- COMMIT ---------------- */

    await client.query("COMMIT");

    sendPartnerRegistrationEmail({
      email: business_email_address,
      companyName: company_name,
      firstName: first_name,
      applicationId: application_id,
    }).catch((emailErr) => {
      console.error("[Background Email Notification Failed]:", emailErr);
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration submitted successfully",
        application_id,
        data: result.rows[0],
      },
      { status: 201 },
    );
  } catch (err: any) {
    await client.query("ROLLBACK");

    console.error("Partner Registration Error:", err);

    return NextResponse.json(
      {
        error: err.message || "Internal Server Error",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}


/* ---------------- EMAIL ---------------- */

    /* const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: business_email_address,

      subject: `Partner Registration Received - ${application_id}`,

      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          
          <h2 style="color:#f97316">
            Partner Registration Submitted
          </h2>

          <p>
            Hello ${first_name || ""} ${last_name || ""},
          </p>

          <p>
            Thank you for registering as a partner.
          </p>

          <p>
            Your application has been received successfully.
          </p>

          <div
            style="
              background:#fff7ed;
              border:1px solid #fdba74;
              padding:20px;
              border-radius:10px;
              margin:20px 0;
            "
          >
            <p style="margin:0;font-size:14px;color:#9a3412">
              Your Application ID
            </p>

            <h1 style="margin:10px 0;color:#ea580c">
              ${application_id}
            </h1>

            <p style="margin:0;font-size:13px;color:#555">
              Please keep this ID safe for tracking your application.
            </p>
          </div>

          <h3>Submitted Details</h3>

          <table
            style="
              width:100%;
              border-collapse:collapse;
            "
          >
            <tr>
              <td><strong>Company</strong></td>
              <td>${company_name}</td>
            </tr>

            <tr>
              <td><strong>Email</strong></td>
              <td>${business_email_address}</td>
            </tr>

            <tr>
              <td><strong>Phone</strong></td>
              <td>${business_phone_number}</td>
            </tr>

            <tr>
              <td><strong>KVK</strong></td>
              <td>${kvk_number}</td>
            </tr>
          </table>

          <p style="margin-top:30px">
            Our team will review your application within 2 working days.
          </p>

          <p>
            Regards,<br />
            AsianSpices Partner Team
          </p>
        </div>
      `,
    }); */

/* import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  {
    // adjust fields to match your formData

    try {
      const body = await req.json();

      const {
        kvk_number,
        company_name,
        chamber_of_commerce_number,
        country,
        street,
        house_number,
        additional_address,
        postal_code,
        city,
        chamberFiles,
        power_of_attorney_document,
        first_name,
        middle_name,
        last_name,
        business_phone_number,
        business_email_address,
        vat_number,
        // idin,
      } = body;

      const result = await pool.query(
        "INSERT INTO partner_registration (kvk_number, company_name, chamber_of_commerce_number,country,street,house_number,additional_address,postal_code,city,chamber_of_commerce_extract_document,power_of_attorney_document,first_name,middle_name,last_name,business_phone_number,business_email_address,vat_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *",
        [
          kvk_number,
          company_name,
          chamber_of_commerce_number,
          country,
          street,
          house_number,
          additional_address,
          postal_code,
          city,
          chamberFiles,
          power_of_attorney_document,
          first_name,
          middle_name,
          last_name,
          business_phone_number,
          business_email_address,
          vat_number,
          // idin,
        ],
      );

      return NextResponse.json(result.rows[0], { status: 201 });
    } catch (err: any) {
      console.error(err.message);

      return NextResponse.json(
        { error: err.message || "Internal Server Error" },
        { status: 500 },
      );
    }
  }
} */

