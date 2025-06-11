import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Users, 
  Heart, 
  Gift, 
  Crown, 
  Play, 
  Square, 
  MessageCircle, 
  Share, 
  Settings,
  Eye,
  ArrowLeft,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function LivePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [selectedStream, setSelectedStream] = useState<any>(null);
  const [isStreamDialogOpen, setIsStreamDialogOpen] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");

  // Queries
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/me"],
    enabled: true,
  });

  const { data: liveStreamsData } = useQuery({
    queryKey: ["/api/live-streams"],
    enabled: true,
  });

  // Mutations
  const startStreamMutation = useMutation({
    mutationFn: (streamData: any) => apiRequest("POST", "/api/live-streams/start", streamData),
    onSuccess: () => {
      toast({
        title: "Live Stream Started",
        description: "Your live stream is now active!",
      });
      setIsStreaming(true);
      queryClient.invalidateQueries({ queryKey: ["/api/live-streams"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start live stream",
        variant: "destructive",
      });
    },
  });

  const stopStreamMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/live-streams/stop", {}),
    onSuccess: () => {
      toast({
        title: "Live Stream Stopped",
        description: "Your live stream has ended",
      });
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: ["/api/live-streams"] });
    },
  });

  const joinStreamMutation = useMutation({
    mutationFn: (streamId: number) => apiRequest("POST", `/api/live-streams/${streamId}/join`, {}),
    onSuccess: () => {
      toast({
        title: "Joined Stream",
        description: "You've joined the live stream",
      });
    },
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!userData) {
    setLocation("/home");
    return null;
  }

  const user = userData as any;
  const liveStreams = (liveStreamsData as any) || [];

  const handleStartStream = () => {
    if (!user.isVip) {
      toast({
        title: "VIP Required",
        description: "Upgrade to VIP to start live streams",
        variant: "destructive",
      });
      setLocation("/vip");
      return;
    }

    if (!streamTitle.trim()) {
      toast({
        title: "Stream Title Required",
        description: "Please enter a title for your stream",
        variant: "destructive",
      });
      return;
    }

    startStreamMutation.mutate({
      title: streamTitle,
      description: streamDescription,
    });
  };

  const handleJoinStream = (stream: any) => {
    if (!user.isVip && stream.isVipOnly) {
      toast({
        title: "VIP Required",
        description: "This stream is VIP only",
        variant: "destructive",
      });
      setLocation("/vip");
      return;
    }

    setSelectedStream(stream);
    setIsStreamDialogOpen(true);
    joinStreamMutation.mutate(stream.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 via-slate-900 to-black relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-red-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-pink-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-500/10 to-violet-500/10 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setLocation("/home")}
              variant="outline"
              size="sm"
              className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
          
          <motion.h1 
            className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
          >
            🎥 Live Streams
          </motion.h1>

          <div className="flex items-center space-x-2">
            {user.isVip ? (
              <Button
                onClick={() => {
                  if (isStreaming) {
                    stopStreamMutation.mutate();
                  } else {
                    // Show stream setup
                    setStreamTitle("");
                    setStreamDescription("");
                  }
                }}
                className={`${isStreaming ? 'bg-red-600 hover:bg-red-700' : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'} text-white`}
              >
                {isStreaming ? <Square className="w-4 h-4 mr-2" /> : <Video className="w-4 h-4 mr-2" />}
                {isStreaming ? "Stop Stream" : "Start Stream"}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  toast({
                    title: "VIP Required",
                    description: "Upgrade to VIP to start live streaming",
                    variant: "destructive",
                  });
                  setLocation("/vip");
                }}
                className="bg-slate-600 hover:bg-slate-500 opacity-75 text-white"
              >
                <Crown className="w-4 h-4 mr-2" />
                Start Stream (VIP Only)
              </Button>
            )}
          </div>
        </div>

        {/* Stream Setup Section */}
        {!isStreaming && user.isVip && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm mb-6"
          >
            <h3 className="text-white text-xl font-semibold mb-4">Start Your Live Stream</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="streamTitle" className="text-slate-300">Stream Title</Label>
                <Input
                  id="streamTitle"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="Enter your stream title..."
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="streamDescription" className="text-slate-300">Description (Optional)</Label>
                <Input
                  id="streamDescription"
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
                  placeholder="Describe your stream..."
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleStartStream}
                disabled={!streamTitle.trim() || startStreamMutation.isPending}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Go Live
              </Button>
            </div>
          </motion.div>
        )}

        {/* Active Stream Section */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-800/80 to-pink-800/80 border border-red-700/50 rounded-xl p-6 backdrop-blur-sm mb-6"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-semibold">LIVE</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <Eye className="w-4 h-4" />
                  <span>{viewerCount} viewers</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  variant="outline"
                  size="sm"
                  className={`${isVideoEnabled ? 'bg-slate-700' : 'bg-red-600'} border-slate-600 text-white`}
                >
                  {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  variant="outline"
                  size="sm"
                  className={`${isAudioEnabled ? 'bg-slate-700' : 'bg-red-600'} border-slate-600 text-white`}
                >
                  {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="bg-black/50 rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center">
                <Video className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-400">Your live stream preview</p>
                <p className="text-slate-500 text-sm">Camera feed would appear here</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Live Streams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveStreams.length > 0 ? (
            liveStreams.map((stream: any) => (
              <motion.div
                key={stream.id}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm hover:border-red-500/50 transition-all duration-300"
              >
                <div className="relative">
                  <div className="bg-black/50 aspect-video flex items-center justify-center">
                    <Video className="w-12 h-12 text-slate-400" />
                  </div>
                  <div className="absolute top-2 left-2 flex items-center space-x-2">
                    <div className="bg-red-600 px-2 py-1 rounded text-white text-xs font-semibold flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                      LIVE
                    </div>
                    {stream.isVipOnly && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        VIP
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-white text-xs flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {stream.viewerCount || 0}
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <Avatar className="w-10 h-10 border-2 border-red-500">
                      <AvatarImage src={stream.streamer?.avatar} />
                      <AvatarFallback className="bg-red-600 text-white">
                        {stream.streamer?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm line-clamp-2">{stream.title}</h3>
                      <p className="text-slate-400 text-xs">{stream.streamer?.username}</p>
                    </div>
                  </div>
                  
                  {stream.description && (
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{stream.description}</p>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleJoinStream(stream)}
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Watch
                    </Button>
                    <Button
                      onClick={() => {
                        if (!user.isVip) {
                          toast({
                            title: "VIP Required",
                            description: "Upgrade to VIP to send gifts",
                            variant: "destructive",
                          });
                          setLocation("/vip");
                          return;
                        }
                        toast({
                          title: "Send Gift",
                          description: "Gift sending feature coming soon!",
                        });
                      }}
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Gift className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Video className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No live streams available</p>
              <p className="text-slate-500">Be the first to go live!</p>
            </div>
          )}
        </div>

        {/* Stream Viewer Dialog */}
        <Dialog open={isStreamDialogOpen} onOpenChange={setIsStreamDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-white">
                {selectedStream?.title}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Streaming by {selectedStream?.streamer?.username}
              </DialogDescription>
            </DialogHeader>
            
            {selectedStream && (
              <div className="space-y-4">
                <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <Video className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-400">Live stream player</p>
                    <p className="text-slate-500 text-sm">Video stream would appear here</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-white font-semibold">LIVE</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-300">
                      <Eye className="w-4 h-4" />
                      <span>{selectedStream.viewerCount || 0} viewers</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        if (!user.isVip) {
                          toast({
                            title: "VIP Required",
                            description: "Upgrade to VIP to send gifts",
                            variant: "destructive",
                          });
                          return;
                        }
                        toast({
                          title: "Gift Sent",
                          description: "Your gift has been sent to the streamer!",
                        });
                      }}
                      size="sm"
                      className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Send Gift
                    </Button>
                    <Button
                      onClick={() => {
                        toast({
                          title: "Shared",
                          description: "Stream link copied to clipboard",
                        });
                      }}
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Share className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}