// components/BlandCallModal.tsx
"use client"

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileNode } from '@/lib/file-processing';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Info } from 'lucide-react';

interface BlandCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedFiles: FileNode[];
}

export function BlandCallModal({ isOpen, onClose, selectedFiles }: BlandCallModalProps) {
    const { toast } = useToast();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [instructions, setInstructions] = useState('');
    const [voiceId, setVoiceId] = useState('default');
    const [isLoading, setIsLoading] = useState(false);
    const [callId, setCallId] = useState<string | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCallId(null);
        }
    }, [isOpen]);

    // Add this function to test backend connectivity
    const checkBackendConfig = async () => {
        setIsLoading(true);
        try {
            const backendUrl = 'http://localhost:8000'; // Your FastAPI backend URL
            console.log('Testing connection to backend at:', `${backendUrl}/api/phone-calls/config-status`);

            const response = await fetch(`${backendUrl}/api/phone-calls/config-status`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error:', response.status, errorText);
                throw new Error(`Server error: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            console.log('Bland API config status:', data);

            if (data.status === 'error') {
                toast({
                    title: 'Bland API Configuration Error',
                    description: data.message,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Bland API Configuration Valid',
                    description: `API URL: ${data.config.bland_api_url}`,
                    variant: 'default',
                });
            }
        } catch (error) {
            console.error('Error checking Bland config:', error);
            toast({
                title: 'Error Checking Configuration',
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMakeCall = async () => {
        if (!phoneNumber.trim() || !validatePhoneNumber(phoneNumber)) {
            toast({
                title: 'Invalid phone number',
                description: 'Please enter a valid phone number with country code (e.g., +1 555 123 4567)',
                variant: 'destructive',
            });
            return;
        }

        if (selectedFiles.length === 0) {
            toast({
                title: 'No files selected',
                description: 'Please select at least one file to use as context for the call',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            // Format the content from selected files to send to Bland AI
            const filesContent = selectedFiles
                .map(file => {
                    return `File: ${file.path}\n\n${file.content || '// Content not available'}\n\n`;
                })
                .join('\n---\n\n');

            // Call the backend API
            const backendUrl = 'http://localhost:8000'; // Your FastAPI backend URL
            const response = await fetch(`${backendUrl}/api/phone-calls`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone_number: phoneNumber,
                    knowledge_base_name: 'Code Repository Analysis',
                    knowledge_base_description: 'Selected files from the user\'s code repository',
                    knowledge_base_text: filesContent,
                    call_instructions: instructions || 'You are a senior developer helping a programmer understand their code. Introduce yourself, ask what they want to learn about their code, and explain it clearly using the context provided.',
                    voice_id: voiceId === 'default' ? undefined : voiceId,
                    wait_for_greeting: true,
                    language: 'en-US',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to initiate call');
            }

            const data = await response.json();
            setCallId(data.call_id);

            toast({
                title: 'Call initiated successfully',
                description: 'You\'ll receive a call from Bland AI shortly',
                variant: 'default',
            });
        } catch (error) {
            console.error('Error making phone call:', error);

            // Determine appropriate error message
            let errorMessage = error instanceof Error ? error.message : 'Please try again later';

            // Special handling for timeout errors
            if (error.name === 'AbortError') {
                errorMessage = 'Request timed out. The selected code may be too large or the server is busy.';
            }

            toast({
                title: 'Error initiating call',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const validatePhoneNumber = (number: string) => {
        // Basic validation for phone numbers
        // Expecting format like +1 555 123 4567 or similar
        return /^\+[1-9]\d{1,14}$/.test(number.replace(/\s+/g, ''));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Receive a Call from Bland AI</DialogTitle>
                    <DialogDescription>
                        Get a phone call with an AI agent that can walk you through your code
                    </DialogDescription>
                </DialogHeader>

                {callId ? (
                    <div className="py-6 flex flex-col items-center gap-4 text-center">
                        <div className="bg-green-100 text-green-800 rounded-full p-3">
                            <CheckCircle className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-medium">Call Initiated!</h3>
                        <p className="text-sm text-muted-foreground">
                            You'll receive a call shortly from Bland AI to discuss your code. Your call ID is:
                        </p>
                        <code className="bg-muted px-2 py-1 rounded">{callId}</code>
                        <Button onClick={onClose} className="mt-2">
                            Close
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+1 555 123 4567"
                                className="col-span-3"
                            />
                            <p className="text-xs text-muted-foreground">
                                Include country code (e.g., +1 for US)
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="voice">Voice</Label>
                            <Select value={voiceId} onValueChange={setVoiceId}>
                                <SelectTrigger id="voice">
                                    <SelectValue placeholder="Select a voice (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Default Voice</SelectItem>
                                    <SelectItem value="dorothy">Dorothy (Female)</SelectItem>
                                    <SelectItem value="james">James (Male)</SelectItem>
                                    <SelectItem value="jeremy">Jeremy (Male)</SelectItem>
                                    <SelectItem value="roger">Roger (Male)</SelectItem>
                                    <SelectItem value="ryan">Ryan (Male)</SelectItem>
                                    <SelectItem value="sam">Sam (Male)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="instructions">Instructions (Optional)</Label>
                            <Textarea
                                id="instructions"
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Give the AI specific instructions for the call"
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="bg-muted p-3 rounded-md">
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="h-4 w-4 text-blue-500" />
                                <Label className="text-sm font-medium">
                                    Selected Files ({selectedFiles.length})
                                </Label>
                            </div>
                            <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                                {selectedFiles.length > 0 ? (
                                    selectedFiles.map((file, index) => (
                                        <div key={index} className="text-muted-foreground">
                                            {file.path}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-yellow-600">
                                        No files selected. Please select files to use as context.
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator className="my-2" />

                        <div className="flex justify-between gap-2">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button variant="outline" onClick={checkBackendConfig}>
                                Test Config
                            </Button>
                            <Button onClick={handleMakeCall} disabled={isLoading || !phoneNumber}>
                                {isLoading ? 'Initiating Call...' : 'Call Me'}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
