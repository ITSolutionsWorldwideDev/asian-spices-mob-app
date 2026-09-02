import { getUserProfile } from "@/services/profileService";
import { sendSupportMessage } from "@/services/supportService";
import { ApiRequestError } from "@/services/api/httpClient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SUPPORT_EMAIL = "support@asianspices.online";

const FAQS = [
  {
    question: "How do I track my order?",
    answer:
      "Once your package leaves our facility, you will receive an email with a tracking link. You can also view order status from My Orders in your profile.",
  },
  {
    question: "What is your return policy?",
    answer:
      "We offer a 14-day return window from the date of delivery. Items must be unused and in original packaging. Opened food or spice products cannot be returned.",
  },
  {
    question: "What should I do if my item arrives damaged?",
    answer:
      "Please take a photo of the damaged product and packaging, then send it to our support team within 48 hours. We will issue a replacement or refund.",
  },
  {
    question: "How long does a refund take?",
    answer:
      "Once approved, refunds typically take 5 to 7 business days to appear on your original payment method.",
  },
];

function ContactCard({
  icon,
  label,
  value,
  subtext,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  subtext: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      className="mb-3 rounded-2xl border-t-4 border-[#FF9800] bg-white px-5 py-5"
    >
      <View className="mb-3 h-11 w-11 items-center justify-center rounded-full bg-[#FFF3E0]">
        <Ionicons name={icon} size={20} color="#FF9800" />
      </View>
      <Text className="mb-1 text-[11px] font-bold tracking-wide text-[#FF9800]">{label}</Text>
      <Text className="mb-1 text-[15px] font-bold text-[#111827]">{value}</Text>
      <Text className="text-[13px] text-[#6B7280]">{subtext}</Text>
    </TouchableOpacity>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: "email-address" | "default";
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-[13px] font-bold text-[#111827]">
        {label} <Text className="text-[#EF4444]">*</Text>
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        className={`rounded-xl border border-[#E5E7EB] bg-white px-4 text-[15px] text-[#111827] ${
          multiline ? "min-h-[120px] py-3" : "h-[48px]"
        }`}
      />
    </View>
  );
}

export default function HelpSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    getUserProfile()
      .then((profile) => {
        setFullName(profile.name);
        setEmail(profile.email);
      })
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      Alert.alert("Missing information", "Please fill in all required fields.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    try {
      setSending(true);
      await sendSupportMessage({
        fullName: trimmedName,
        email: trimmedEmail,
        subject: trimmedSubject,
        message: trimmedMessage,
      });
      Alert.alert(
        "Message sent",
        "Your message was sent successfully. Our support team will respond within 48 hours.",
      );
      setSubject("");
      setMessage("");
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : `Please email us at ${SUPPORT_EMAIL}.`;
      Alert.alert("Unable to send", message);
    } finally {
      setSending(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F5F0EA]">
      <View
        className="border-b border-[#EAEAEA] bg-white"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <View className="flex-row items-center px-4">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="h-9 w-9 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={26} color="#333333" />
          </TouchableOpacity>
          <Text className="mr-9 flex-1 text-center text-[18px] font-bold text-black">
            Help & Support
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pt-5 pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-center text-[26px] font-bold text-[#1B0D07]">Get In Touch</Text>
          <Text className="mt-2 mb-5 text-center text-[14px] leading-6 text-[#6B7280]">
            Have a question? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon
            as possible.
          </Text>

          <ContactCard
            icon="mail-outline"
            label="CONTACT US"
            value={SUPPORT_EMAIL}
            subtext="We will respond within 48 hours"
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          />
          <ContactCard
            icon="time-outline"
            label="BUSINESS HOURS"
            value="Mon – Fri: 10AM – 5PM"
            subtext="Weekend: Closed"
          />

          <Text className="mt-4 text-[22px] font-bold text-[#1B0D07]">Send Us a Message</Text>
          <View className="mb-5 mt-2 h-1 w-12 rounded-full bg-[#FF9800]" />

          <View className="rounded-2xl bg-white p-4">
            <Field
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
            />
            <Field
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              keyboardType="email-address"
            />
            <Field
              label="Subject"
              value={subject}
              onChangeText={setSubject}
              placeholder="What is this regarding?"
            />
            <Field
              label="Message"
              value={message}
              onChangeText={setMessage}
              placeholder="Tell us how we can help you..."
              multiline
            />

            <TouchableOpacity
              onPress={() => {
                void handleSend();
              }}
              disabled={sending}
              activeOpacity={0.85}
              className="mt-1 h-[50px] flex-row items-center justify-center rounded-xl bg-[#FF9800]"
              style={{ opacity: sending ? 0.7 : 1 }}
            >
              <Text className="mr-2 text-[15px] font-semibold text-white">
                {sending ? "Sending..." : "Send Message"}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text className="mt-8 text-[20px] font-bold text-[#1B0D07]">
            Frequently Asked Questions
          </Text>
          <View className="mt-3 overflow-hidden rounded-2xl bg-white">
            {FAQS.map((faq, index) => {
              const open = openFaq === index;
              return (
                <View key={faq.question}>
                  <TouchableOpacity
                    onPress={() => setOpenFaq(open ? null : index)}
                    activeOpacity={0.8}
                    className="flex-row items-center justify-between px-4 py-4"
                  >
                    <Text className="mr-3 flex-1 text-[14px] font-semibold text-[#111827]">
                      {faq.question}
                    </Text>
                    <Ionicons
                      name={open ? "chevron-up" : "chevron-down"}
                      size={18}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                  {open ? (
                    <Text className="px-4 pb-4 text-[13px] leading-6 text-[#6B7280]">
                      {faq.answer}
                    </Text>
                  ) : null}
                  {index < FAQS.length - 1 ? <View className="h-px bg-[#F3F4F6]" /> : null}
                </View>
              );
            })}
          </View>

          <View className="mt-6 overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white">
            <View className="border-b border-[#E7E5E4] px-4 py-4">
              <Text className="text-[18px] font-semibold text-[#292524]">Company Details</Text>
            </View>
            <View className="flex-row border-b border-[#E7E5E4]">
              <Text className="w-[42%] bg-[#FAFAF9] px-4 py-3 text-[13px] font-medium text-[#44403C]">
                Company Name
              </Text>
              <Text className="flex-1 px-4 py-3 text-[13px] text-[#57534E]">
                Asian Spices Online B.V.
              </Text>
            </View>
            <View className="flex-row border-b border-[#E7E5E4]">
              <Text className="w-[42%] bg-[#FAFAF9] px-4 py-3 text-[13px] font-medium text-[#44403C]">
                Business Address
              </Text>
              <Text className="flex-1 px-4 py-3 text-[13px] text-[#57534E]">
                Slakkenveen 341, 3205 GK Spijkenisse
              </Text>
            </View>
            <View className="flex-row">
              <Text className="w-[42%] bg-[#FAFAF9] px-4 py-3 text-[13px] font-medium text-[#44403C]">
                Chamber of Commerce
              </Text>
              <Text className="flex-1 px-4 py-3 text-[13px] text-[#57534E]">42041922</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
