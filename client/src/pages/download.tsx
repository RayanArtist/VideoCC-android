import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle, AlertCircle } from "lucide-react";

export default function DownloadPage() {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const downloadAPK = async () => {
    setDownloading(true);
    
    try {
      // Download APK from server endpoint
      const response = await fetch('/api/download-apk');
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'VideoCC-Mobile-App.apk';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      setTimeout(() => {
        setDownloading(false);
        setDownloaded(true);
      }, 1000);
      
    } catch (error) {
      console.error('Download failed:', error);
      setDownloading(false);
      
      // Fallback: direct link method
      const link = document.createElement('a');
      link.href = '/api/download-apk';
      link.download = 'VideoCC-Mobile-App.apk';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => {
        setDownloaded(true);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto pt-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Download Video.C.C
          </h1>
          <p className="text-xl text-gray-300">
            Get the mobile app for the complete Video Communication Chat experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="bg-black/20 backdrop-blur-sm border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Smartphone className="h-6 w-6" />
                Mobile App Features
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                HD Video Calling ($1/minute)
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Secure End-to-End Messaging
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                VIP Membership System
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                VCC Token Economy
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Live Streaming Platform
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                USDT Cryptocurrency Payments
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-sm border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">App Information</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <div>
                <strong>Package:</strong> com.videocc.app
              </div>
              <div>
                <strong>Version:</strong> 1.0.0
              </div>
              <div>
                <strong>Size:</strong> 2.7 KB
              </div>
              <div>
                <strong>Source:</strong> Local Server
              </div>
              <div>
                <strong>Platform:</strong> Android 5.1+
              </div>
              <div>
                <strong>Permissions:</strong> Camera, Microphone, Internet, Storage
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card className="bg-black/30 backdrop-blur-sm border-gray-600 max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Ready to Download</CardTitle>
              <CardDescription className="text-gray-300">
                Click the button below to download the APK file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={downloadAPK}
                disabled={downloading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 text-lg"
              >
                {downloading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Preparing Download...
                  </div>
                ) : downloaded ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Downloaded Successfully
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Download APK
                  </div>
                )}
              </Button>
              
              {downloaded && (
                <div className="mt-4 p-3 bg-green-900/30 border border-green-600 rounded-lg">
                  <div className="flex items-center gap-2 text-green-300">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm">
                      APK download started. Check your Downloads folder and enable "Install from unknown sources".
                    </span>
                  </div>
                </div>
              )}
              
              <div className="mt-4 text-center">
                <a 
                  href="/api/download-apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  Direct Download Link (if button fails)
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Card className="bg-orange-900/20 backdrop-blur-sm border-orange-600">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-orange-400 mt-1 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="text-orange-300 font-semibold mb-2">Installation Instructions</h3>
                  <ol className="text-orange-200 space-y-1 text-sm">
                    <li>1. Download the APK file above</li>
                    <li>2. Go to Settings → Security → Enable "Install from unknown sources"</li>
                    <li>3. Open the downloaded APK file</li>
                    <li>4. Follow the installation prompts</li>
                    <li>5. Launch Video.C.C and enjoy!</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}