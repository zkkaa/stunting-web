'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { FiChevronDown, FiCamera, FiArrowLeft, FiArrowRightCircle } from 'react-icons/fi';
import { LuUndo2 } from 'react-icons/lu';
import { useRouter, useSearchParams } from 'next/navigation';

function CameraPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCamera, setSelectedCamera] = useState<'Camera Raspberry' | 'Camera Handphone'>('Camera Raspberry');
  const [showCameraDropdown, setShowCameraDropdown] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCaptureResult, setShowCaptureResult] = useState(false);
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raspberryImgRef = useRef<HTMLImageElement>(null);
  const RASPBERRY_URL = 'http://10.13.0.22:8000/video';
  const RASPBERRY_CAPTURE_URL = 'http://10.13.0.22:8000/capture';
  const RASPBERRY_CALIBRATE_URL = 'http://10.13.0.22:8000/calibrate/aruco';
  const RASPBERRY_DIRECT_CAPTURE_URL = 'http://10.13.0.22:8000/direct-capture'; // Alternative endpoint if available
  
  // Production API URLs - UNTUK CAMERA HANDPHONE
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://comvit-production.up.railway.app';
  const API_CALIBRATE_URL = `${API_BASE_URL}/calibrate/aruco`; // Production calibration endpoint
  const API_PING_URL = `${API_BASE_URL}/ping`; // Production ping endpoint - https://comvit-production.up.railway.app/ping
  const API_CAPTURE_URL = `${API_BASE_URL}/capture`; // Production capture endpoint - https://comvit-production.up.railway.app/capture
  
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [calibrationResult, setCalibrationResult] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<{ status: string; message?: string; responseTime?: number } | null>(null);
  
  // Child data state
  const [childData, setChildData] = useState<{ id: string; name: string; gender: string; age: number } | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null); // Store captured image blob

  // Computed classes
  const getVideoPreviewClass = () => {
    const base = 'w-full h-[600px] object-cover';
    // Remove mirror effect - display video normally
    return base;
  };

  // Get initial camera type from URL params
  useEffect(() => {
    const cameraType = searchParams?.get('camera');
    if (cameraType === 'handphone') {
      setSelectedCamera('Camera Handphone');
    } else {
      setSelectedCamera('Camera Raspberry');
    }
  }, [searchParams]);

  // Load child data from URL params and localStorage/API
  useEffect(() => {
    const loadChildData = async () => {
      const childId = searchParams?.get('child');
      
      // Dummy data untuk testing
      const dummyChildren = [
        { id: 'child_001', name: 'Ahmad Fadhil', gender: 'male', age: 12 },
        { id: 'child_002', name: 'Siti Aisyah', gender: 'female', age: 18 },
        { id: 'child_003', name: 'Budi Santoso', gender: 'male', age: 24 },
        { id: 'child_004', name: 'Putri Ayu', gender: 'female', age: 15 },
        { id: 'child_005', name: 'Dika Pratama', gender: 'male', age: 20 },
      ];
      
      if (!childId) {
        console.warn('⚠️ No child ID in URL params');
        // Set default dummy data for testing
        console.log('🧪 Using default dummy data for testing...');
        setChildData(dummyChildren[0]); // Default: Ahmad Fadhil
        return;
      }

      console.log('👶 Loading child data for ID:', childId);

      // Check if childId matches dummy data
      const dummyChild = dummyChildren.find(c => c.id === childId);
      if (dummyChild) {
        console.log('🧪 Using dummy data:', dummyChild);
        setChildData(dummyChild);
        return;
      }

      // Try to get from localStorage first
      try {
        const storedChildren = localStorage.getItem('children');
        if (storedChildren) {
          const children = JSON.parse(storedChildren);
          const child = children.find((c: { id: string }) => c.id === childId);
          
          if (child) {
            console.log('✅ Child data loaded from localStorage:', child);
            setChildData({
              id: child.id,
              name: child.name || 'Unknown',
              gender: child.gender || 'male',
              age: child.age || 12
            });
            return;
          }
        }
      } catch (error) {
        console.error('❌ Failed to load from localStorage:', error);
      }

      // If not found in localStorage, try to fetch from API
      try {
        console.log('📡 Fetching child data from API...');
        const response = await fetch(`/api/children/${childId}`);
        
        if (response.ok) {
          const child = await response.json();
          console.log('✅ Child data loaded from API:', child);
          
          setChildData({
            id: child.id,
            name: child.name || 'Unknown',
            gender: child.gender || 'male',
            age: child.age || 12
          });
        } else {
          console.warn('⚠️ Child not found in API, using dummy data');
          // Use dummy data if API fails
          setChildData({
            id: childId,
            name: 'Anak Test',
            gender: 'male',
            age: 12
          });
        }
      } catch (error) {
        console.error('❌ Failed to fetch from API:', error);
        // Use dummy data if API fails
        console.log('🧪 Using dummy data as fallback...');
        setChildData({
          id: childId,
          name: 'Anak Test',
          gender: 'male',
          age: 12
        });
      }
    };

    loadChildData();
  }, [searchParams]);

  // Initialize camera (only for Handphone - local device camera)
  useEffect(() => {
    const setupCamera = async () => {
      if (selectedCamera === 'Camera Handphone') {
        await initializeCamera();
      } else {
        // stop any existing local streams when switching to Raspberry
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((t) => t.stop());
          videoRef.current.srcObject = null;
        }
      }
    };
    
    setupCamera();
  }, [selectedCamera]);

  const initializeCamera = async () => {
    setIsInitializingCamera(true);
    try {
      if (videoRef.current) {
        // Stop any existing stream first
        if (videoRef.current.srcObject) {
          const existingStream = videoRef.current.srcObject as MediaStream;
          existingStream.getTracks().forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        }
        
        console.log('📱 Initializing camera...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 1280, 
            height: 720,
            // Use rear camera to avoid mirrored preview on mobile
            facingMode: 'environment'
          } 
        });
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log('✅ Camera stream loaded');
              resolve();
            };
          }
        });
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setErrorMessage('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
    } finally {
      setIsInitializingCamera(false);
    }
  };

  const captureFromRaspberry = async (): Promise<string | null> => {
    try {
      console.log('🍓 Capturing from Raspberry camera...');
      
      // Method 1: Try to capture current frame from the video stream first
      if (raspberryImgRef.current && canvasRef.current) {
        console.log('📷 Method 1: Attempting to capture current frame from stream...');
        const img = raspberryImgRef.current as HTMLImageElement;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        console.log('Raspberry image details:', {
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          width: img.width,
          height: img.height,
          complete: img.complete,
          src: img.src
        });
        
        if (context && img.complete) {
          const w = img.naturalWidth || img.width || 1280;
          const h = img.naturalHeight || img.height || 720;
          canvas.width = w;
          canvas.height = h;
          
          try {
            // Try to draw the image and capture it
            context.drawImage(img, 0, 0, w, h);
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            console.log('✅ Frame captured from stream, converting to blob...');
            
            // Convert to blob and send to API
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            
            const formData = new FormData();
            const filename = `raspberry_capture_${Date.now()}.jpg`;
            formData.append('image', blob, filename);
            
            console.log('🚀 Method 1: Sending captured frame to API...');
            const uploadResponse = await fetch(RASPBERRY_CAPTURE_URL, {
              method: 'POST',
              body: formData,
              headers: {
                'accept': 'application/json',
              },
              mode: 'cors',
            });
            
            if (uploadResponse.ok) {
              const result = await uploadResponse.json();
              if (result.status === 'success' && result.image) {
                console.log('✅ Method 1 successful:', result.image);
                return result.image;
              }
            }
            
          } catch (drawError) {
            console.warn('❌ Method 1 failed (likely CORS):', drawError);
          }
        }
      }
      
      // Method 2: Try direct capture endpoint (if exists)
      try {
        console.log('📷 Method 2: Trying direct capture endpoint...');
        const directResponse = await fetch(RASPBERRY_DIRECT_CAPTURE_URL, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
          },
          mode: 'cors',
        });
        
        if (directResponse.ok) {
          const result = await directResponse.json();
          if (result.status === 'success' && result.image) {
            console.log('✅ Method 2 successful:', result.image);
            return result.image;
          }
        } else if (directResponse.status !== 404) {
          console.warn('Method 2 failed:', directResponse.status, directResponse.statusText);
        }
      } catch (directError) {
        console.warn('Method 2 not available:', directError);
      }
      
      // Method 3: Create a more realistic trigger image
      console.log('📷 Method 3: Creating realistic trigger image...');
      const canvas = document.createElement('canvas');
      canvas.width = 640; // More realistic camera resolution
      canvas.height = 480;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Create a more realistic image that looks like a camera capture
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#f0f0f0');
        gradient.addColorStop(0.5, '#e0e0e0');
        gradient.addColorStop(1, '#d0d0d0');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some visual elements to make it look more like a real image
        context.fillStyle = '#407A81';
        context.fillRect(50, 50, canvas.width - 100, canvas.height - 100);
        
        context.fillStyle = 'white';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillText('RASPBERRY PI', canvas.width / 2, canvas.height / 2 - 20);
        context.fillText('CAPTURE TRIGGER', canvas.width / 2, canvas.height / 2 + 20);
        
        // Add timestamp
        context.font = '14px Arial';
        context.fillText(new Date().toISOString(), canvas.width / 2, canvas.height - 30);
        
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.95); // Higher quality
        });
        
        if (blob) {
          console.log('📊 Created trigger image:', {
            size: blob.size,
            type: blob.type,
            width: canvas.width,
            height: canvas.height
          });
          
          const formData = new FormData();
          const filename = `raspberry_trigger_${Date.now()}.jpg`;
          formData.append('image', blob, filename);
          
          // Log the FormData contents for debugging
          console.log('� FormData details:');
          for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
              console.log(`  ${key}:`, {
                name: value.name,
                size: value.size,
                type: value.type,
                lastModified: value.lastModified
              });
            } else {
              console.log(`  ${key}:`, value);
            }
          }
          
          console.log('�🚀 Method 3: Sending trigger image to API...');
          const uploadResponse = await fetch(RASPBERRY_CAPTURE_URL, {
            method: 'POST',
            body: formData,
            headers: {
              'accept': 'application/json',
            },
            mode: 'cors',
          });
          
          console.log('📡 Method 3 response:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            ok: uploadResponse.ok,
            headers: Object.fromEntries(uploadResponse.headers.entries())
          });
          
          // Log the raw response text first
          const responseText = await uploadResponse.text();
          console.log('📄 Raw response text:', responseText);
          
          if (!uploadResponse.ok) {
            throw new Error(`Method 3 failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${responseText}`);
          }
          
          let result;
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            console.error('❌ Failed to parse JSON response:', parseError);
            throw new Error(`Invalid JSON response: ${responseText}`);
          }
          
          console.log('📥 Method 3 parsed result:', result);
          
          if (result.status === 'success') {
            if (result.image) {
              console.log('✅ Method 3 successful with image:', result.image);
              return result.image;
            } else {
              console.warn('⚠️ Method 3 successful but image is null:', result);
              // Still return something to indicate success, even if image is null
              return `trigger_response_${Date.now()}`;
            }
          } else {
            throw new Error(result.message || 'Method 3 failed - server returned error status');
          }
        }
      }
      
      throw new Error('Failed to create any valid capture request');
      
    } catch (error) {
      console.error('❌ All Raspberry capture methods failed:', error);
      throw error;
    }
  };

  const handleCameraSwitch = (camera: 'Camera Raspberry' | 'Camera Handphone') => {
    setSelectedCamera(camera);
    setShowCameraDropdown(false);
  };

  // Upload to Production API (ComViT) - For Camera Handphone
  const uploadToProductionAPI = async (imageBlob: Blob): Promise<string | null> => {
    try {
      console.log('📤 Starting upload to Production API (ComViT)...');
      console.log('API URL:', API_CAPTURE_URL);
      console.log('Image blob size:', imageBlob.size);
      
      setIsUploading(true);
      
      // Use child data from state
      if (!childData) {
        throw new Error('Child data not loaded. Please select a child first.');
      }
      
      console.log('👶 Using child data:', childData);
      
      // Prepare required parameters from state
      const gender = childData.gender;
      const age = childData.age;
      const ref = childData.id;
      
      console.log('📋 Request parameters:', { gender, age, ref });
      
      // Validate parameters
      if (!gender || !age || !ref) {
        throw new Error('Missing required parameters: gender, age, or ref');
      }
      
      // Create FormData with ONLY image (gender, age, ref go in query params)
      const formData = new FormData();
      const filename = `capture_handphone_${Date.now()}.jpg`;
      formData.append('image', imageBlob, filename);
      
      // Build URL with query parameters
      const urlWithParams = `${API_CAPTURE_URL}?gender=${encodeURIComponent(gender)}&age=${age}&ref=${encodeURIComponent(ref)}`;
      
      console.log('📝 Request details:');
      console.log('  - URL with params:', urlWithParams);
      console.log('  - gender:', gender);
      console.log('  - age:', age);
      console.log('  - ref:', ref);
      console.log('  - image:', filename, '(', imageBlob.size, 'bytes)');
      
      // Upload to Production API
      console.log('🚀 Sending request to ComViT Production API...');
      const uploadResponse = await fetch(urlWithParams, {
        method: 'POST',
        body: formData,
        headers: {
          'accept': 'application/json',
        },
        mode: 'cors',
      });
      
      console.log('📡 Response received:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        ok: uploadResponse.ok
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text().catch(() => 'No error text available');
        console.error('❌ Upload failed:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          errorText
        });
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
      }
      
      // Get raw response text first for better debugging
      const responseText = await uploadResponse.text();
      console.log('📄 Raw response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      console.log('📥 Parsed JSON response:', result);
      
      // Check if response is successful
      if (result.status === 'success' || uploadResponse.ok) {
        console.log('✅ Upload to Production API successful');
        
        // Ambil image_url langsung dari response
        return result.image_url || null;
      } else {
        console.error('❌ API returned error status:', result);
        throw new Error(result.message || 'Upload failed - server returned error status');
      }
      
    } catch (error) {
      console.error('❌ Upload to Production API error:', error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Network error - possible CORS or connectivity issue');
        setErrorMessage('Gagal terhubung ke server ComViT. Periksa koneksi internet.');
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Gagal mengunggah gambar ke server. Silakan coba lagi.');
      }
      
      setTimeout(() => setErrorMessage(null), 8000);
      
      return null;
    } finally {
      setIsUploading(false);
      console.log('🏁 Upload to Production API process finished');
    }
  };

  const handleCapture = async () => {
    console.log('🎯 Capture button clicked!');
    console.log('Selected camera:', selectedCamera);
    console.log('Is capturing:', isCapturing);
    
    setIsCapturing(true);
    setErrorMessage(null);
    
    try {
      let capturedDataUrl: string | null = null;
      let capturedImageBlob: Blob | null = null;
      
      // Capture from local device camera
      if (selectedCamera === 'Camera Handphone' && videoRef.current && canvasRef.current) {
        console.log('📱 Capturing from handphone camera...');
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');
        
        console.log('Video dimensions:', {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState
        });
        
        if (context && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          // Draw video to canvas without flipping
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Get data URL for preview
          capturedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          console.log('✅ Handphone capture successful, data URL length:', capturedDataUrl.length);
          
          // Convert to blob and store it (don't upload yet)
          console.log('� Converting to blob for later upload...');
          capturedImageBlob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', 0.9);
          });
          
          if (capturedImageBlob) {
            setCapturedBlob(capturedImageBlob);
            console.log('✅ Image blob stored:', {
              size: capturedImageBlob.size,
              type: capturedImageBlob.type
            });
          }
          
        } else {
          console.error('❌ Cannot capture from handphone camera:', {
            hasContext: !!context,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState
          });
          throw new Error('Kamera handphone tidak siap atau tidak tersedia');
        }
      } else if (selectedCamera === 'Camera Raspberry') {
        console.log('🍓 Using direct Raspberry capture...');
        // For Raspberry, capture directly from the API (upload immediately)
        const uploadedImageName = await captureFromRaspberry();
        
        if (uploadedImageName) {
          // Create a preview image URL from the server
          const previewUrl = `${RASPBERRY_CAPTURE_URL.replace('/capture', '')}/images/${uploadedImageName}`;
          console.log('📷 Setting preview URL:', previewUrl);
          capturedDataUrl = previewUrl;
          
          // Store for Raspberry (already uploaded)
          sessionStorage.setItem('uploadedImageName', uploadedImageName);
        }
      } else {
        console.error('❌ Capture conditions not met:', {
          selectedCamera,
          hasVideoRef: !!videoRef.current,
          hasRaspberryImgRef: !!raspberryImgRef.current,
          hasCanvasRef: !!canvasRef.current
        });
        throw new Error('Kondisi kamera tidak terpenuhi');
      }
      
      // Show preview for both camera types
      if (capturedDataUrl) {
        console.log('🖼️ Setting captured image for preview...');
        setCapturedImage(capturedDataUrl);
        setShowCaptureResult(true);
        
        // Stop camera stream untuk Camera Handphone saat preview ditampilkan
        if (selectedCamera === 'Camera Handphone' && videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        }
        
        console.log('✅ Image captured successfully');
      } else {
        console.error('❌ No image data captured');
        setErrorMessage('Tidak ada gambar yang berhasil diambil. Pastikan kamera berfungsi dengan baik.');
        setTimeout(() => setErrorMessage(null), 5000);
      }
      
    } catch (error) {
      console.error('❌ Capture failed with error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Gagal mengambil gambar. Silakan coba lagi.');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setTimeout(() => {
        setIsCapturing(false);
        console.log('🏁 Capture process finished');
      }, 500);
    }
  };

  const handleRetake = async () => {
    console.log('🔄 Starting retake process...');
    
    // Reset states immediately
    setCapturedImage(null);
    setCapturedBlob(null);
    setShowCaptureResult(false);
    setErrorMessage(null);
    
    // Give UI time to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Restart camera stream untuk Camera Handphone
    if (selectedCamera === 'Camera Handphone') {
      try {
        console.log('🔄 Restarting camera after retake...');
        setIsInitializingCamera(true);
        
        // Small delay to ensure state is properly reset
        await new Promise(resolve => setTimeout(resolve, 200));
        
        await initializeCamera();
        console.log('✅ Camera restarted successfully');
      } catch (error) {
        console.error('❌ Failed to restart camera:', error);
        setErrorMessage('Gagal menginisialisasi ulang kamera. Silakan refresh halaman.');
      } finally {
        setIsInitializingCamera(false);
      }
    }
    
    console.log('🏁 Retake process completed');
  };

  const handleCalibrate = async () => {
    try {
      setIsCalibrating(true);
      setCalibrationResult(null);
      setErrorMessage(null);
      
      let imageBlob: Blob | null = null;
      let calibrateUrl = '';
      
      if (selectedCamera === 'Camera Raspberry') {
        // Kalibrasi untuk Raspberry Camera
        calibrateUrl = RASPBERRY_CALIBRATE_URL;
        
        // Try to grab current frame from Raspberry camera
        if (raspberryImgRef.current && canvasRef.current) {
          const img = raspberryImgRef.current as HTMLImageElement;
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          
          if (context) {
            const w = img.naturalWidth || img.width || 1280;
            const h = img.naturalHeight || img.height || 720;
            canvas.width = w;
            canvas.height = h;
            
            try {
              context.drawImage(img, 0, 0, w, h);
              const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
              const response = await fetch(imageDataUrl);
              imageBlob = await response.blob();
            } catch {
              console.warn('Calibrate drawImage failed (CORS likely), proceeding without image payload');
            }
          }
        }
      } else if (selectedCamera === 'Camera Handphone') {
        // Kalibrasi untuk Camera Handphone - kirim ke API production
        calibrateUrl = API_CALIBRATE_URL;
        
        // Capture current frame from video stream
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          
          if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Draw video frame to canvas (without mirroring for API)
            context.save();
            context.scale(1, 1); // Don't mirror for calibration
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            context.restore();
            
            // Convert to blob
            imageBlob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob(resolve, 'image/jpeg', 0.95);
            });
            
            console.log('📸 Captured frame from handphone camera for calibration');
          } else {
            throw new Error('Video stream not ready. Please wait for camera to initialize.');
          }
        } else {
          throw new Error('Camera not initialized. Please allow camera access.');
        }
      } else {
        throw new Error('Please select a camera first.');
      }

      // Prepare request
      const formData = new FormData();
      
      if (imageBlob) {
        formData.append('image', imageBlob, `calibrate_${selectedCamera.toLowerCase().replace(' ', '_')}_${Date.now()}.jpg`);
        console.log('📦 FormData prepared:', {
          camera: selectedCamera,
          imageSize: imageBlob.size,
          imageType: imageBlob.type,
          url: calibrateUrl
        });
      } else {
        console.warn('⚠️ No image captured, sending empty request');
      }
      
      console.log('🚀 Sending calibration request to:', calibrateUrl);
      
      const res = await fetch(calibrateUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'accept': 'application/json',
        },
        mode: 'cors',
      });
      
      console.log('📡 Response status:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Calibration failed:', errorText);
        
        // Parse error message if it's JSON
        let errorMessage = `${res.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.status === 'failed') {
            errorMessage = errorJson.message || 'Calibration Failed. Marker not detected.';
          }
        } catch {
          // If not JSON, use the text response
          errorMessage = errorText || res.statusText;
        }
        
        throw new Error(`Calibration failed: ${errorMessage}`);
      }
      
      try {
        const result = await res.json();
        console.log('✅ Calibration successful:', result);
        setCalibrationResult(JSON.stringify(result, null, 2));
      } catch {
        console.log('✅ Calibration successful (non-JSON response)');
        setCalibrationResult('Calibration completed successfully');
      }
      
    } catch (error) {
      console.error('❌ Calibration error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(`❌ Kalibrasi gagal: ${errorMsg}`);
    } finally {
      setIsCalibrating(false);
    }
  };

  // handlePingTest function removed - functionality now integrated into testConnection()

  const handleContinue = async () => {
    try {
      setIsUploading(true);
      
      let finalImageUrl: string | null = null;
      
      // For Camera Handphone, upload the captured blob to Production API
      if (selectedCamera === 'Camera Handphone' && capturedBlob) {
        console.log('📤 Uploading captured image to Production API...');
        
        if (!childData) {
          setErrorMessage('❌ Data anak tidak ditemukan. Silakan pilih anak terlebih dahulu.');
          setTimeout(() => setErrorMessage(null), 5000);
          return;
        }
        
        // Kirim ke ComViT API dan ambil image_url langsung
        const imageUrl = await uploadToProductionAPI(capturedBlob);
        
        if (imageUrl) {
          finalImageUrl = imageUrl;
          console.log('✅ Got marked image URL from ComViT:', finalImageUrl);
        } else {
          // Upload failed, error already handled in uploadToProductionAPI
          console.error('❌ Upload failed, aborting navigation');
          return;
        }
      } else if (selectedCamera === 'Camera Raspberry') {
        // For Raspberry, get the uploaded image name from session storage
        const uploadedImageName = sessionStorage.getItem('uploadedImageName');
        if (uploadedImageName) {
          finalImageUrl = `https://kgswlhiolxopunygghrs.supabase.co/storage/v1/object/public/temp/${uploadedImageName}`;
          console.log('⚠️ Using original image URL as fallback:', finalImageUrl);
        }
      }
      
      console.log('🎯 Final image URL for result page:', finalImageUrl);
      
      // Get child ID from URL params
      const childId = searchParams?.get('child');
      const cameraType = searchParams?.get('camera');
      
      // Navigate to result page with imageUrl parameter
      const params = new URLSearchParams({
        ...(childId && { child: childId }),
        ...(cameraType && { camera: cameraType }),
        ...(finalImageUrl && { imageUrl: finalImageUrl }),
        timestamp: Date.now().toString()
      });
      
      router.push(`/result?${params.toString()}`);
      
    } catch (error) {
      console.error('❌ Continue process error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Gagal memproses gambar');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setPingResult(null);
    setErrorMessage(null);

    try {
      if (selectedCamera === 'Camera Handphone') {
        // Ping test untuk Camera Handphone - ke Production API
        // Validation: Ensure we're NOT using Raspberry URL
        if (API_PING_URL.includes('10.13.0.22') || API_PING_URL.includes('localhost')) {
          console.error('❌ ERROR: Ping URL incorrectly pointing to local/Raspberry endpoint!');
          alert('Configuration Error: API URL should point to production, not local server!');
          return;
        }

        console.log('� Testing connection to ComViT Production API...');
        console.log('📡 Target: Production API (NOT Raspberry Pi)');
        console.log('📡 Ping URL:', API_PING_URL);
        console.log('📡 Expected: https://comvit-production.up.railway.app/ping');
        console.log('✅ Validation: URL is correct (Production API)');

        const startTime = performance.now();

        const response = await fetch(API_PING_URL, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
          },
          mode: 'cors',
        });

        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);

        console.log('📡 Response status:', response.status, response.statusText);
        console.log('⏱️ Response time:', responseTime, 'ms');

        if (!response.ok) {
          throw new Error(`Ping failed: ${response.status} ${response.statusText}`);
        }

        let result;
        try {
          result = await response.json();
          console.log('✅ Ping response:', result);
        } catch {
          // If response is not JSON, treat as success with text response
          const textResponse = await response.text();
          result = { message: textResponse };
          console.log('✅ Ping response (text):', textResponse);
        }

        setPingResult({
          status: 'success',
          message: typeof result === 'string' ? result : (result.message || 'API is online'),
          responseTime: responseTime
        });

      } else {
        // Test connection untuk Camera Raspberry
        console.log('🔍 Testing connection to Raspberry Pi...');
        const testUrl = RASPBERRY_CAPTURE_URL.replace('/capture', '/');
        console.log('🔗 Testing basic connection to:', testUrl);
        
        const response = await fetch(testUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'accept': 'application/json',
          },
        });
        
        console.log('📡 Raspberry connection test response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        if (response.ok) {
          setErrorMessage('✅ Koneksi ke Raspberry Pi berhasil!');
          setTimeout(() => setErrorMessage(null), 5000);
        } else {
          setErrorMessage(`❌ Raspberry Pi merespons dengan error: ${response.status}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Connection test error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (selectedCamera === 'Camera Handphone') {
        setPingResult({
          status: 'error',
          message: errorMsg
        });
        setErrorMessage(`❌ Ping test gagal: ${errorMsg}`);
      } else {
        setErrorMessage('❌ Tidak dapat terhubung ke Raspberry Pi. Periksa jaringan atau server.');
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen relative">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="bg-white/80 backdrop-blur-sm rounded-full p-3 hover:bg-white/90 transition-colors shadow-lg"
          >
            <FiArrowLeft className="w-6 h-6 text-gray-700" />
          </button>

          {/* Camera Selector Dropdown */}
          <div className="relative flex items-center gap-2">
            {/* Test Connection Button */}
            <button
              onClick={testConnection}
              disabled={isTestingConnection}
              className={`bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg text-xs transition-colors ${
                isTestingConnection ? 'opacity-50' : ''
              }`}
            >
              {isTestingConnection ? 'Testing...' : 'Test API'}
            </button>
            
            <button
              onClick={() => setShowCameraDropdown(!showCameraDropdown)}
              className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-white transition-colors shadow-lg border border-gray-200"
            >
              <span className="text-gray-700 font-medium text-sm">{selectedCamera}</span>
              <FiChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {showCameraDropdown && (
              <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-30 p-3">
                <div className="space-y-2">
                  <button
                    onClick={() => handleCameraSwitch('Camera Raspberry')}
                    className={`w-full text-center py-3 px-4 rounded-lg font-medium transition-colors ${
                      selectedCamera === 'Camera Raspberry' 
                        ? 'bg-[#407A81] text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Camera Rusbery
                  </button>
                  <button
                    onClick={() => handleCameraSwitch('Camera Handphone')}
                    className={`w-full text-center py-3 px-4 rounded-lg font-medium transition-colors border border-[#407A81] ${
                      selectedCamera === 'Camera Handphone' 
                        ? 'bg-[#407A81] text-white' 
                        : 'bg-white text-[#407A81] hover:bg-[#407A81] hover:text-white'
                    }`}
                  >
                    Camera Handphone
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 max-w-md w-full mx-4">
            <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
              <button 
                onClick={() => setErrorMessage(null)}
                className="flex-shrink-0 hover:bg-red-600 rounded p-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-20">
          {/* Camera Container */}
          <div className="relative w-full max-w-4xl mx-auto">
            {/* Camera View */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl">
            {!showCaptureResult ? (
              selectedCamera === 'Camera Handphone' ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={getVideoPreviewClass()}
                  />
                  {isInitializingCamera && (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#407A81] mx-auto mb-4"></div>
                        <p className="text-gray-600">Menginisialisasi kamera...</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <img
                  ref={raspberryImgRef}
                  src={RASPBERRY_URL}
                  alt="Raspberry Stream"
                  className="w-full h-[600px] object-cover"
                />
              )
            ) : (
                capturedImage ? (
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-[600px] object-cover [transform:scaleX(1)]"
                  />
                ) : (
                  <div className="w-full h-[600px] bg-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Gambar Berhasil Diambil</h3>
                      <p className="text-sm text-gray-600">Gambar telah disimpan di server</p>
                    </div>
                  </div>
                )
              )}
              
              {/* Overlay Frame */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner brackets */}
                <div className="absolute top-8 left-8 w-12 h-12">
                  <div className="absolute top-0 left-0 w-full h-2 bg-cyan-400 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-2 h-full bg-cyan-400 rounded-full"></div>
                </div>
                <div className="absolute top-8 right-8 w-12 h-12">
                  <div className="absolute top-0 right-0 w-full h-2 bg-cyan-400 rounded-full"></div>
                  <div className="absolute top-0 right-0 w-2 h-full bg-cyan-400 rounded-full"></div>
                </div>
                <div className="absolute bottom-8 left-8 w-12 h-12">
                  <div className="absolute bottom-0 left-0 w-full h-2 bg-cyan-400 rounded-full"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-full bg-cyan-400 rounded-full"></div>
                </div>
                <div className="absolute bottom-8 right-8 w-12 h-12">
                  <div className="absolute bottom-0 right-0 w-full h-2 bg-cyan-400 rounded-full"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-full bg-cyan-400 rounded-full"></div>
                </div>

                {/* Center guidelines */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-32 h-0.5 bg-cyan-400/50 mb-2"></div>
                  <div className="w-0.5 h-32 bg-cyan-400/50 mx-auto"></div>
                </div>
              </div>

              {/* Camera Status - Top Center */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 text-white px-3 py-2 rounded-lg z-20">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm">{selectedCamera}</span>
                {isUploading && (
                  <span className="text-xs ml-2 bg-blue-500 px-2 py-1 rounded">Uploading...</span>
                )}
                {isCalibrating && (
                  <span className="text-xs ml-2 bg-yellow-500 px-2 py-1 rounded">Calibrating...</span>
                )}
              </div>

              {/* Calibration Success Message */}
              {calibrationResult && !errorMessage && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 max-w-md bg-green-500 text-white px-4 py-3 rounded-lg shadow-xl z-20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">✅ Kalibrasi Berhasil!</p>
                    </div>
                    <button 
                      onClick={() => setCalibrationResult(null)}
                      className="text-white hover:text-gray-200"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Ping Test Success Message */}
              {pingResult && pingResult.status === 'success' && !errorMessage && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 max-w-md bg-green-500 text-white px-4 py-3 rounded-lg shadow-xl z-20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">✅ Koneksi API Berhasil! Response time: {pingResult.responseTime}ms</p>
                    </div>
                    <button 
                      onClick={() => setPingResult(null)}
                      className="text-white hover:text-gray-200"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Instruction and Controls - Center Bottom */}
              {!showCaptureResult ? (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3">
                  {/* Instruction Text */}
                  <div className="bg-black/70 text-white px-4 py-2 rounded-lg">
                    <p className="text-sm text-center">
                      Posisikan subjek dalam bingkai
                      <br />
                      <span className="text-xs text-gray-300">Ketuk tombol kamera saat siap</span>
                    </p>
                  </div>
                  
                  {/* Controls row */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCapture}
                      disabled={isCapturing || isUploading}
                      className={`bg-[#407A81] hover:bg-[#326269] disabled:bg-gray-400 text-white rounded-full p-4 shadow-xl transition-all duration-200 ${
                        isCapturing ? 'scale-95' : 'hover:scale-105'
                      }`}
                    >
                      <FiCamera className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleCalibrate}
                      disabled={isCalibrating}
                      className={`rounded-full px-4 py-2 shadow-xl border transition-colors duration-200 ${
                        isCalibrating ? 'bg-gray-200 border-gray-300 text-gray-500' : 'bg-white border-[#407A81] text-[#407A81] hover:bg-[#E7F5F7]'
                      }`}
                      title={`Kalibrasi ${selectedCamera}`}
                    >
                      {isCalibrating ? 'Calibrating…' : 'Calibrate'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                  {/* Retake Button */}
                  <button
                    onClick={handleRetake}
                    disabled={isUploading}
                    className={`bg-white hover:bg-gray-100 text-[#407A81] rounded-full p-4 shadow-xl transition-all duration-200 border border-gray-200 ${
                      isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                    }`}
                  >
                    <LuUndo2 className="w-6 h-6" />
                  </button>
                  
                  {/* Continue Button */}
                  <button
                    onClick={handleContinue}
                    disabled={isUploading}
                    className={`bg-[#407A81] hover:bg-[#326269] text-white rounded-full p-4 shadow-xl transition-all duration-200 relative ${
                      isUploading ? 'opacity-75 cursor-wait' : 'hover:scale-105'
                    }`}
                  >
                    {isUploading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiArrowRightCircle className="w-6 h-6" />
                    )}
                  </button>
                  
                  {/* Upload Status Text */}
                  {isUploading && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded text-xs whitespace-nowrap">
                      Mengupload ke server...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Layout>
  );
}

function CameraPageLoading() {
  return (
    <Layout>
      <div className="min-h-screen bg-[#F8FBFC] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#407A81] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading camera...</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function CameraPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<CameraPageLoading />}>
        <CameraPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
