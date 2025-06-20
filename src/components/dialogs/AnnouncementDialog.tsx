
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Megaphone } from "lucide-react";

interface AnnouncementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  turmaName?: string; // Optional: if it's for a specific turma
}

export function AnnouncementDialog({
  isOpen,
  onOpenChange,
  title,
  message,
  turmaName,
}: AnnouncementDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Megaphone className="mr-2 h-6 w-6 text-primary" />
            {title}
          </DialogTitle>
          {turmaName && (
            <DialogDescription className="text-xs text-muted-foreground">
              Para: Turma {turmaName}
            </DialogDescription>
          )}
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] my-4 pr-4">
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {message}
          </p>
        </ScrollArea>
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="default">
              Entendido
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    