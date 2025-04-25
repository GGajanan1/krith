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

const Meeting = ({ params: { id } }: { params: { id: string } }) => {
  const { user, isLoaded } = useUser();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const { call, isCallLoading } = useGetCallById(id);
  const [meeting, setMeeting] = useState<any>(null);
  const [userCity, setUserCity] = useState<string>("");
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [requestInfo, setRequestInfo] = useState({ name: "", empid: "", desg: "" });

  useEffect(() => {
    // Fetch meeting details
    axios.get(`/api/meetings?id=${id}`).then(res => setMeeting(res.data));
    // Get user city
    fetch("https://ipinfo.io/json?token=YOUR_TOKEN")
      .then(res => res.json())
      .then(data => setUserCity(data.city));
  }, [id]);

  useEffect(() => {
    if (meeting && userCity) {
      if (!meeting.cities.includes(userCity)) setNotAuthorized(true);
    }
  }, [meeting, userCity]);

  const handleRequest = async () => {
    await axios.post("/api/meeting-requests", {
      meetingId: id,
      ...requestInfo,
      city: userCity,
    });
    // Show confirmation, etc.
  };

  if(!isLoaded || isCallLoading) return <Loader />;

  if (notAuthorized) {
    return (
      <MeetingModal
        isOpen={true}
        onClose={() => {}}
        title="Not Authorized"
        description="You are not authorized to join. Request access below."
        buttonText="Request Access"
        handleClick={handleRequest}
      >
        <Input placeholder="Name" value={requestInfo.name} onChange={e => setRequestInfo({ ...requestInfo, name: e.target.value })} />
        <Input placeholder="EmpID" value={requestInfo.empid} onChange={e => setRequestInfo({ ...requestInfo, empid: e.target.value })} />
        <Input placeholder="Designation" value={requestInfo.desg} onChange={e => setRequestInfo({ ...requestInfo, desg: e.target.value })} />
      </MeetingModal>
    );
  }

  return (
    <main className='h-screen w-full'>
      <StreamCall call={call}>
        <StreamTheme>
          { !isSetupComplete ? (
            <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
          ): (
            <MeetingRoom />
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  )
}

export default Meeting;