'use client';

import { ReactNode } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import Image from "next/image";

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
  handleClick?: () => void;
  buttonText?: string;
  instantMeeting?: boolean;
  image?: string;
  buttonClassName?: string;
  buttonIcon?: string;
}

const MeetingModal = ({
  isOpen,
  onClose,
  title,
  description,
  className,
  children,
  handleClick,
  buttonText,
  image,
  buttonIcon,
}: MeetingModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex w-full max-w-[520px] flex-col gap-6 border-none bg-dark-1 px-6 py-9 text-white">
        <div className="flex flex-col gap-6">
          {image && (
            <div className="flex justify-center">
              <Image src={image} alt="checked" width={72} height={72} />
            </div>
          )}
          <h1 className={cn("text-3xl font-bold leading-[42px] text-center", className)}>
            {title}
          </h1>
          {description && (
            <h3 className="text-sky-1 text-center">
              {description}
            </h3>
          )}
          {children}
          {buttonText && handleClick && (
            <Button
              className={cn(
                "bg-blue-1 focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-white hover:text-dark-1 duration-300 ease-in-out",
              )}
              onClick={handleClick}
            >
              {buttonIcon && (
                <Image
                  src={buttonIcon}
                  alt="button icon"
                  width={13}
                  height={13}
                />
              )}
              &nbsp;{buttonText}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingModal;
