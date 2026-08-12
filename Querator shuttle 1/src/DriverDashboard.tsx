import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export function DriverDashboard({ driverId }: { driverId: string }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active driver check reference
  console.log('Active Driver ID:', driverId);
  
  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transport_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('public:transport_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transport_requests' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateTripStatus = async (requestId: string, newStatus: string) => {
    const { error } = await supabase
      .from('transport_requests')
      .update({ status: newStatus })
      .eq('id', requestId);

    if (error) {
      alert(`Error updating status: ${error.message}`);
    } else {
      fetchRequests();
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600 font-medium">Loading Driver Dispatch Feed...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-600">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Shuttle Driver Live Dispatch</h1>
        <p className="text-gray-600 text-sm">Monitor student pick-up requests and update live transit statuses in real time.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Live Transport Queue ({requests.length})</h2>
        
        {requests.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No student transport requests available at the moment.</p>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="p-4 border rounded-lg bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="font-bold text-gray-900 text-base">{req.student_name} <span className="text-xs font-normal text-gray-500">({req.assigned_complex} - Room {req.room_number})</span></p>
                  <p className="text-sm text-blue-700 font-medium mt-1">📍 Pickup: {req.pickup_location}</p>
                  <p className="text-xs text-gray-500 mt-0.5">🕒 Scheduled: {new Date(req.scheduled_time).toLocaleString()}</p>
                </div>
                
                <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    req.status === 'Dispatched' ? 'bg-green-100 text-green-800' : 
                    req.status === 'Completed' ? 'bg-gray-200 text-gray-700' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {req.status}
                  </span>

                  {req.status !== 'Dispatched' && (
                    <button
                      onClick={() => updateTripStatus(req.id, 'Dispatched')}
                      className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 transition"
                    >
                      Dispatch Shuttle
                    </button>
                  )}

                  {req.status === 'Dispatched' && (
                    <button
                      onClick={() => updateTripStatus(req.id, 'Completed')}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-700 transition"
                    >
                      Complete Trip
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}