import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export function StudentDashboard({ studentId }: { studentId: string }) {
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [transportRequests, setTransportRequests] = useState<any[]>([]);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffTime, setDropoffTime] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStudentData = async () => {
    setLoading(true);
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (profile) {
      setStudentProfile(profile);

      // Fetch student's transport requests
      const { data: requests } = await supabase
        .from('transport_requests')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (requests) setTransportRequests(requests);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (studentId) fetchStudentData();
  }, [studentId]);

  // Handle Requesting Transport
  const handleRequestTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupLocation || !dropoffTime) {
      alert('Please fill in both pickup location and scheduled time.');
      return;
    }

    const { error } = await supabase.from('transport_requests').insert({
      student_id: studentId,
      student_name: studentProfile?.full_name,
      assigned_complex: studentProfile?.assigned_complex,
      room_number: studentProfile?.room_number,
      pickup_location: pickupLocation,
      scheduled_time: dropoffTime,
      status: 'Pending Dispatch'
    });

    if (error) {
      alert(`Error requesting transport: ${error.message}`);
    } else {
      alert('Transport request submitted successfully!');
      setPickupLocation('');
      setDropoffTime('');
      fetchStudentData();
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600 font-medium">Loading Student Commuter Portal...</div>;
  }

  const isApproved = studentProfile?.is_approved;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header Profile Info */}
      <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-600">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Student Commuter Portal</h1>
        <p className="text-gray-600 text-sm">Welcome, <span className="font-semibold">{studentProfile?.full_name || 'Student'}</span>!</p>
        
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded border">
            <span className="text-gray-500 block text-xs uppercase font-semibold">Assigned Housing Complex</span>
            <span className="font-bold text-blue-900">{studentProfile?.assigned_complex || 'Not assigned'}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded border">
            <span className="text-gray-500 block text-xs uppercase font-semibold">Room / Unit Number</span>
            <span className="font-bold text-gray-800">{studentProfile?.room_number || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Account Status Card */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">Boarding & Transport Status</h2>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">Approval State:</span>
          {isApproved ? (
            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
              Approved & Active Boarder
            </span>
          ) : (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">
              Awaiting Management Approval
            </span>
          )}
        </div>

        {!isApproved && (
          <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r">
            <p className="text-xs text-yellow-800">
              Your boarding application has been submitted to your housing caretaker. Shuttle request tools will unlock once fully cleared.
            </p>
          </div>
        )}
      </div>

      {/* Transport Booking Module (Only for Approved Students) */}
      {isApproved && (
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-indigo-600">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Request Shuttle Transport</h2>
          
          <form onSubmit={handleRequestTransport} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Pickup Location (Residence / Gate)</label>
              <input
                type="text"
                required
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Main Entrance Gate"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Scheduled Time Window</label>
              <input
                type="datetime-local"
                required
                value={dropoffTime}
                onChange={(e) => setDropoffTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium text-sm hover:bg-indigo-700 transition"
            >
              Submit Transport Request
            </button>
          </form>

          {/* Request History / Live Status */}
          <div className="mt-6">
            <h3 className="text-md font-bold text-gray-800 mb-3">Your Active & Past Requests</h3>
            {transportRequests.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No transport requests made yet.</p>
            ) : (
              <div className="space-y-3">
                {transportRequests.map((req) => (
                  <div key={req.id} className="p-3 border rounded bg-gray-50 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-semibold text-gray-900">Pickup: {req.pickup_location}</p>
                      <p className="text-xs text-gray-500">Time: {new Date(req.scheduled_time).toLocaleString()}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded ${
                      req.status === 'Dispatched' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}