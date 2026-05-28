import { useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useLiveStreamViewer } from '../../contexts/LiveStreamViewerContext';
import { useAuth } from '../../contexts/AuthContext';
import LiveRegulationsModal from './components/LiveRegulationsModal';

export default function LiveViewer() {
  const { id: routeStreamId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { 
    streamId, setStreamId, stream, loading, rulesGate, acceptRules, setPortalElement 
  } = useLiveStreamViewer();

  // If host accesses their own stream, redirect to dashboard immediately
  useEffect(() => {
    if (stream && user && stream.streamerId === user.id) {
      navigate('/livestream/dashboard', { replace: true });
    }
  }, [stream, user, navigate]);

  // Set the streamId in the global context when we land on this page
  useEffect(() => {
    if (routeStreamId && routeStreamId !== streamId) {
      setStreamId(routeStreamId);
    }
  }, [routeStreamId, streamId, setStreamId]);

  const elementRef = useRef<HTMLDivElement | null>(null);

  // Callback ref — registers/unregisters the portal div element in context
  const portalRef = useCallback((el: HTMLDivElement | null) => {
    elementRef.current = el;
    setPortalElement(el);
  }, [setPortalElement]);

  // Clean up portal element when unmounting
  useEffect(() => {
    return () => {
      setPortalElement((prev) => (prev === elementRef.current ? null : prev));
    };
  }, [setPortalElement]);

  if (!rulesGate) {
    return (
      <LiveRegulationsModal
        open
        onClose={() => navigate('/livestream')}
        onAccept={acceptRules}
        acceptLabel="Đồng ý và vào xem"
      />
    );
  }

  // If we are still syncing the route ID to context, or loading the stream from context
  if (loading || streamId !== routeStreamId) {
    return (
      <div className="flex justify-center py-32">
        <div
          className="w-10 h-10 border-[3px] rounded-full animate-spin border-blue-600 border-t-transparent"
          aria-label="Đang tải"
        />
      </div>
    );
  }

  // If loading finished but no stream was found
  if (!loading && !stream && streamId === routeStreamId) {
    return <div className="text-center py-32 text-slate-600 dark:text-slate-300">Stream không tồn tại</div>;
  }

  // The actual viewer content is rendered via GlobalViewerOverlay using a React Portal into this div
  return (
    <div className="min-h-[calc(100vh-4rem)] px-2 sm:px-4">
       <div ref={portalRef} id="live-viewer-portal" className="w-full h-full min-h-[min(92vh,900px)]" />
    </div>
  );
}
