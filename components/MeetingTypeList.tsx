'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import HomeCard from './HomeCard';
import MeetingModal from './MeetingModal';
import { create } from 'domain';
import { useUser } from '@clerk/nextjs';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from './ui/textarea';
import ReactDatePicker from 'react-datepicker';
import { Button } from './ui/button';
import { Input } from "./ui/input";
import axios from "axios";

const MeetingTypeList = () => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<
    'isScheduleMeeting' | 'isJoiningMeeting' | 'isInstantMeeting' | undefined
  >(undefined)

  const { user } = useUser();
  const client = useStreamVideoClient();
  const [values, setValues] = useState({
    dateTime: new Date(),
    description: '',
    link: '',
  })

  const [callDetails, setCallDetails] = useState<Call>()
  const { toast } = useToast()

  const [numLocations, setNumLocations] = useState<number>(0);
  const [cityFields, setCityFields] = useState<string[]>([]);
  const [showLocationInputs, setShowLocationInputs] = useState(false);

  const handleNumLocationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numLocations > 0) {
      setCityFields(Array(numLocations).fill(""));
      setShowLocationInputs(true);
    }
  };

  const handleCityFieldChange = (idx: number, value: string) => {
    setCityFields(fields => fields.map((f, i) => (i === idx ? value : f)));
  };

  const createMeeting = async () => {
    if(!client || !user) return;
    try {
      if (meetingState === 'isScheduleMeeting') {
        if(!values.dateTime) {
          toast({ title: "No no no...", description: "Please select a date and time and try again." });
          return;
        }
        if(values.dateTime < new Date(Date.now())) {
          toast({ title: "No no no...", description: "Please select a future date and time." });
          return;
        }
        if(!values.description) {
          toast({ title: "No no no...", description: "Please write a short description of the meeting." });
          return;
        }
      }
      if (!cityFields.length || cityFields.some(c => !c.trim())) {
        toast({ title: "No no no...", description: "Please enter all authorized city names." });
        return;
      }
      
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.description,
          description: values.description,
          cities: cityFields.map(c => c.trim()),
        })
      });
      if (!res.ok) throw new Error('Failed to create meeting');
      const data = await res.json();
      toast({ title: "You are ready!", description: "Meeting was successfully created." });
      setCallDetails(undefined); // or setMeetingId(data.id) if you want to show the link
      setShowLocationInputs(false);
      setNumLocations(0);
      setCityFields([]);
    } catch (error) {
      console.log(error);
      toast({ title: "Whoops!", description: "Failed to create meeting. Please try again." });
    }
  }

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetails?.id}`

  const [joinMeetingData, setJoinMeetingData] = useState<any>(null);
  const [joinMeetingLoading, setJoinMeetingLoading] = useState(false);
  const [joinMeetingError, setJoinMeetingError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);

  const handleJoinMeeting = async () => {
    setJoinMeetingLoading(true);
    setJoinMeetingError(null);
    setJoinMeetingData(null);
    setShowInput(false);
    try {
      const res = await fetch('https://mani.pythonanywhere.com/');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setJoinMeetingData(data);
      console.log('Fetched data:', data);
      setShowInput(true);
    } catch (e) {
      setJoinMeetingError('Unknown error');
    } finally {
      setJoinMeetingLoading(false);
    }
  };

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 max-w-[1300px]">
      <HomeCard
        img="/icons/add-meeting.svg"
        title="New Meeting"
        description="Start an instant meeting"
        className="bg-orange-1 duration-300 ease-in-out hover:opacity-65"
        handleClick={() => setMeetingState('isInstantMeeting')}
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Join Meeting"
        description="via invitation link"
        className="bg-blue-1 duration-300 ease-in-out hover:opacity-65"
        handleClick={() => setMeetingState('isJoiningMeeting')}
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Schedule Meeting"
        description="Plan your meeting"
        className="bg-purple-1 duration-300 ease-in-out hover:opacity-65"
        handleClick={() => setMeetingState('isScheduleMeeting')}
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="View Recordings"
        description="Meeting Recordings"
        className="bg-yellow-1 duration-300 ease-in-out hover:opacity-65"
        handleClick={() => router.push('/recordings')}
      />

      {!callDetails ? (
      <MeetingModal
        isOpen={meetingState === 'isScheduleMeeting'}
        onClose={() => {
          setMeetingState(undefined);
          setShowLocationInputs(false);
          setNumLocations(0);
          setCityFields([]);
        }}
        title="Set up a scheduled meeting"
        description=""
        handleClick={showLocationInputs ? createMeeting : undefined}
        buttonText={showLocationInputs ? 'Create Meeting' : undefined}
      >
        <div className='flex flex-col gap-2.5'>
          <label className='text-base text-normal leading-22px text-sky-2'>Description</label>
          <Textarea
          className='border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0'
          onChange={(e) => {
            setValues({ ...values, description: e.target.value })
          }}
          />
        </div>
        <div className='flex w-full flex-col gap-2.5'>
          <label className='text-base text-normal leading-22px text-sky-2'>Date & time</label>
          <ReactDatePicker
              selected={values.dateTime}
              onChange={(date) => setValues({ ...values, dateTime: date! })}
              showTimeSelect
              timeFormat='HH:mm'
              timeIntervals={15}
              timeCaption='time'
              dateFormat='MMMM d, yyyy h:mm aa'
              className='w-full rounded bg-dark-3 p-2 focus:outline-none text-sky-2'
            />
        </div>
        {!showLocationInputs ? (
          <form onSubmit={handleNumLocationsSubmit}>
            <Input
              type="number"
              min={1}
              value={numLocations}
              onChange={e => setNumLocations(Number(e.target.value))}
              placeholder="Enter number of locations"
            />
            <Button type="submit">Next</Button>
          </form>
        ) : (
          <div>
            {cityFields.map((city, idx) => (
              <Input
                key={idx}
                placeholder={`Location ${idx + 1}`}
                value={city}
                onChange={e => handleCityFieldChange(idx, e.target.value)}
              />
            ))}
          </div>
        )}
      </MeetingModal>
      ) : (
      <MeetingModal
        isOpen={meetingState === 'isScheduleMeeting'}
        onClose={() => setMeetingState(undefined)}
        title='Meeting Created'
        description=''
        handleClick={() => {
          navigator.clipboard.writeText(meetingLink);
          toast({ title: 'Link copied to clipboard' });
        }}
        image='/icons/checked.svg'
        buttonIcon='/icons/copy.svg'
        className='text-center'
        buttonText='Copy Meeting Link'
      />
      )}

      <MeetingModal
        isOpen={meetingState === 'isInstantMeeting'}
        onClose={() => setMeetingState(undefined)}
        title='Connectify is ready, are you?'
        description=''
        className='text-center'
        buttonText='Start Meeting'
        handleClick={createMeeting}
      />

      <MeetingModal
        isOpen={meetingState === 'isJoiningMeeting'}
        onClose={() => {
          setMeetingState(undefined);
          setJoinMeetingData(null);
          setJoinMeetingError(null);
          setShowInput(false);
        }}
        title='Join a meeting!'
        description="Paste the invite link, click join, and the rest is magic!"
        className='text-center'
        buttonText='Join Meeting'
        handleClick={handleJoinMeeting}
      >
        {joinMeetingLoading && (
          <div className="mt-4 text-sky-2">Loading data...</div>
        )}
        {joinMeetingError && (
          <div className="mt-4 text-red-500">Error: {joinMeetingError}</div>
        )}
        {joinMeetingData && (
          <pre className="mt-4 bg-dark-3 p-2 rounded text-left max-h-60 overflow-auto text-xs">
            {JSON.stringify(joinMeetingData, null, 2)}
          </pre>
        )}
        {showInput && (
          <Input
            placeholder='Meeting link'
            className='bg-dark-3 border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sky-2 mt-4'
            onChange = {(e) => setValues({ ...values, link: e.target.value })}
          />
        )}
      </MeetingModal>
    </section>
  );
};

export default MeetingTypeList;