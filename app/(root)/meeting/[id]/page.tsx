'use client';
import { useEffect, useState } from "react";
import axios from "axios";
import MeetingModal from "@/components/MeetingModal";
import { Input } from "@/components/ui/input";
import { useGetCallById } from '@/hooks/useGetCallById';
import { useUser } from '@clerk/nextjs';
import { StreamCall, StreamTheme } from '@stream-io/video-react-sdk';
import Loader from "@/components/Loader";
import MeetingSetup from "@/components/MeetingSetup";
import MeetingRoom from "@/components/MeetingRoom";
import { useRouter } from 'next/navigation';

const Meeting = ({ params: { id } }: { params: { id: string } }) => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const { call, isCallLoading } = useGetCallById(id);
  const [meeting, setMeeting] = useState<any>(null);
  const [userCity, setUserCity] = useState<string>("");
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [requestInfo, setRequestInfo] = useState({ name: "", empid: "", desg: "", email: "" });
  const [vpnStatus, setVpnStatus] = useState<string>("");

  useEffect(() => {
    axios.get(`/api/meetings?meetingId=${id}`).then(res => setMeeting(res.data));
    fetch("https://mani.pythonanywhere.com/")
      .then(res => res.json())
      .then(data => {
        setUserCity(data.city);
        setVpnStatus(data.vpn === "yes" ? "yes" : "no");
      });
  }, [id]);

  useEffect(() => {
    if (vpnStatus === "yes") {
      alert("Not authorized: VPN detected");
      router.push("/");
      return;
    }
    if (meeting && userCity) {
      if (!meeting.cities.includes(userCity)) setNotAuthorized(true);
      else {
        setNotAuthorized(false);
        setTimeout(() => router.push(`/meeting/${id}`), 500);
      }
    }
  }, [meeting, userCity, vpnStatus]);

  const generateAndSendOtp = async () => {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    setOtp(otpCode);

    try {
      await axios.post("/api/send-otp", {
        email: requestInfo.email,
        otp: otpCode,
      });
      setOtpSent(true);
      alert("OTP sent to your email.");
    } catch (error) {
      console.error("OTP error:", error);
      alert("Failed to send OTP.");
    }
  };

  const handleRequestAccess = async () => {
    if (enteredOtp !== otp) {
      alert("Incorrect OTP.");
      return;
    }

    await axios.post("/api/meeting-requests", {
      meetingId: id,
      ...requestInfo,
      city: userCity,
    });

    alert("Request submitted.");
  };

  if (!isLoaded || isCallLoading) return <Loader />;

  if (notAuthorized) {
    return (
      <MeetingModal
        isOpen={true}
        onClose={() => {}}
        title="Not Authorized"
        description="You are not authorized to join. Request access below."
        buttonText={otpSent ? "Submit Request" : "Send OTP"}
        handleClick={otpSent ? handleRequestAccess : generateAndSendOtp}
      >
        <Input placeholder="Name" value={requestInfo.name} onChange={e => setRequestInfo({ ...requestInfo, name: e.target.value })} />
        <Input placeholder="EmpID" value={requestInfo.empid} onChange={e => setRequestInfo({ ...requestInfo, empid: e.target.value })} />
        <Input placeholder="Designation" value={requestInfo.desg} onChange={e => setRequestInfo({ ...requestInfo, desg: e.target.value })} />
        <Input placeholder="Email" value={requestInfo.email} onChange={e => setRequestInfo({ ...requestInfo, email: e.target.value })} />
        {otpSent && (
          <Input placeholder="Enter OTP" value={enteredOtp} onChange={e => setEnteredOtp(e.target.value)} />
        )}
      </MeetingModal>
    );
  }

  return (
    <main className='h-screen w-full'>
      <StreamCall call={call}>
        <StreamTheme>
          {!isSetupComplete ? (
            <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
          ) : (
            <MeetingRoom />
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  );
};

export default Meeting;
