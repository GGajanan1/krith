'use client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk'
import React, { use } from 'react'
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

const EndCallButton = () => {
  const call = useCall();
  const router = useRouter();
  
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const isMeetingOwner = localParticipant && call?.state.createdBy && localParticipant.userId === call.state.createdBy.id;

  if(!isMeetingOwner) return null;

  return (
    <Button onClick={async () => {
        await call.endCall();
        router.push('/');
    }} className='bg-red-500 ease-in-out duration-300 hover:bg-white hover:text-dark-1 hover:animate-pulse'>
        End Call 
    </Button>
  )
}

export default EndCallButton