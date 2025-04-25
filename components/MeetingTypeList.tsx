'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from './ui/textarea';
import ReactDatePicker from 'react-datepicker';
import { Button } from './ui/button';
import { Input } from "./ui/input";
import HomeCard from './HomeCard';
import MeetingModal from './MeetingModal';

const MeetingTypeList = () => {
  const router = useRouter();
  const { user } = useUser();
  const client = useStreamVideoClient();
  const { toast } = useToast();

  const [meetingState, setMeetingState] = useState<'isScheduleMeeting' | 'isJoiningMeeting' | 'isInstantMeeting' | undefined>(undefined);
  const [values, setValues] = useState({ dateTime: new Date(), description: '', link: '' });
  const [callDetails, setCallDetails] = useState<Call>();
  const [numLocations, setNumLocations] = useState(0);
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
    setCityFields(prev => prev.map((field, i) => (i === idx ? value : field)));
  };

  const createMeeting = async () => {
    if (!client || !user) return;

    const title = values.description.trim();
    const description = values.description.trim();
    const cities = cityFields.map(city => city.trim()).filter(Boolean);

    if (!title) {
      toast({ title: "Missing info", description: "Please add a short meeting description." });
      return;
    }

    if (!cities.length) {
      toast({ title: "Missing info", description: "Please enter at least one city." });
      return;
    }

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, cities })
      });

      if (!res.ok) throw new Error('Error creating meeting');
      await res.json();

      toast({ title: "Success!", description: "Meeting successfully created." });
      setCallDetails(undefined);
      setNumLocations(0);
      setCityFields([]);
      setShowLocationInputs(false);
      setMeetingState(undefined);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Unable to create meeting. Please try again." });
    }
  };

  const [joinMeetingData, setJoinMeetingData] = useState<any>(null);
  const [joinMeetingLoading, setJoinMeetingLoading] = useState(false);
  const [joinMeetingError, setJoinMeetingError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);

  const handleJoinMeeting = async () => {
    setJoinMeetingLoading(true);
    setJoinMeetingError(null);
    setJoinMeetingData(null);

    try {
      const res = await fetch('https://mani.pythonanywhere.com/');
      if (!res.ok) throw new Error('Failed to fetch join info');
      const data = await res.json();
      setJoinMeetingData(data);
      setShowInput(true);
    } catch (error) {
      setJoinMeetingError('Failed to join meeting.');
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
        className="bg-orange-1 hover:opacity-65"
        handleClick={() => setMeetingState('isInstantMeeting')}
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Join Meeting"
        description="via invitation link"
        className="bg-blue-1 hover:opacity-65"
        handleClick={() => setMeetingState('isJoiningMeeting')}
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Schedule Meeting"
        description="Plan your meeting"
        className="bg-purple-1 hover:opacity-65"
        handleClick={() => setMeetingState('isScheduleMeeting')}
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="View Recordings"
        description="Meeting Recordings"
        className="bg-yellow-1 hover:opacity-65"
        handleClick={() => router.push('/recordings')}
      />

      {/* Schedule Meeting Modal */}
      <MeetingModal
        isOpen={meetingState === 'isScheduleMeeting'}
        onClose={() => {
          setMeetingState(undefined);
          setNumLocations(0);
          setCityFields([]);
          setShowLocationInputs(false);
        }}
        title="Set up a scheduled meeting"
        handleClick={showLocationInputs ? createMeeting : undefined}
        buttonText={showLocationInputs ? "Create Meeting" : undefined}
      >
        <div className="flex flex-col gap-2.5">
          <label className="text-base text-sky-2">Description</label>
          <Textarea
            className="bg-dark-3 border-none text-sky-2"
            onChange={(e) => setValues({ ...values, description: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2.5 mt-4">
          <label className="text-base text-sky-2">Date & Time</label>
          <ReactDatePicker
            selected={values.dateTime}
            onChange={(date) => setValues({ ...values, dateTime: date! })}
            showTimeSelect
            dateFormat="MMMM d, yyyy h:mm aa"
            className="w-full rounded bg-dark-3 p-2 text-sky-2"
          />
        </div>

        {!showLocationInputs ? (
          <form onSubmit={handleNumLocationsSubmit} className="mt-4 flex gap-2 items-center">
            <Input
              type="number"
              min={1}
              value={numLocations}
              onChange={(e) => setNumLocations(Number(e.target.value))}
              placeholder="Enter number of locations"
              className="text-black bg-white"
            />
            <Button type="submit">Next</Button>
          </form>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {cityFields.map((city, idx) => (
              <Input
                key={idx}
                placeholder={`Location ${idx + 1}`}
                value={city}
                onChange={(e) => handleCityFieldChange(idx, e.target.value)}
                className="text-black bg-white"
              />
            ))}
          </div>
        )}
      </MeetingModal>

      {/* Instant Meeting Modal */}
      <MeetingModal
        isOpen={meetingState === 'isInstantMeeting'}
        onClose={() => {
          setMeetingState(undefined);
          setNumLocations(0);
          setCityFields([]);
        }}
        title="Start an instant meeting"
        className="text-center"
      >
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-base text-normal leading-22px text-sky-2">Number of cities</label>
          <Input
            type="number"
            min={1}
            value={numLocations}
            onChange={e => {
              const value = Number(e.target.value);
              setNumLocations(value);
              setCityFields(Array(value).fill(""));
            }}
            placeholder="Enter number of cities"
            className="text-black bg-white"
          />
        </div>
        {numLocations > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <label className="text-base text-normal leading-22px text-sky-2">Enter city names</label>
            {cityFields.map((city, idx) => (
              <Input
                key={idx}
                placeholder={`City ${idx + 1}`}
                value={city}
                onChange={e => {
                  const newFields = [...cityFields];
                  newFields[idx] = e.target.value;
                  setCityFields(newFields);
                }}
                className="text-black bg-white"
              />
            ))}
          </div>
        )}
        {numLocations > 0 && cityFields.length === numLocations && cityFields.every(c => c.trim()) && (
          <Button
            className="mt-4"
            onClick={async () => {
              if (!client || !user) return;
              const id = crypto.randomUUID();
              const call = client.call('default', id);
              await call.getOrCreate({ data: { starts_at: new Date().toISOString(), cities: cityFields } });
              router.push(`/meeting/${id}`);
            }}
          >Create Link & Start Meeting</Button>
        )}
      </MeetingModal>

      {/* Join Meeting Modal */}
      <MeetingModal
        isOpen={meetingState === 'isJoiningMeeting'}
        onClose={() => {
          setMeetingState(undefined);
          setJoinMeetingData(null);
          setJoinMeetingError(null);
          setShowInput(false);
        }}
        title="Join a meeting!"
        description="Paste the invite link and click Join"
        className="text-center"
        buttonText="Join Meeting"
        handleClick={handleJoinMeeting}
      >
        {joinMeetingLoading && <p className="text-sky-2">Loading...</p>}
        {joinMeetingError && <p className="text-red-500">{joinMeetingError}</p>}
        {joinMeetingData && (
          <pre className="bg-dark-3 p-2 rounded text-left text-xs max-h-60 overflow-auto">
            {JSON.stringify(joinMeetingData, null, 2)}
          </pre>
        )}
        {showInput && (
          <Input
            className="mt-4 bg-dark-3 text-sky-2 border-none"
            placeholder="Meeting link"
            onChange={(e) => setValues({ ...values, link: e.target.value })}
          />
        )}
      </MeetingModal>
    </section>
  );
};

export default MeetingTypeList;
