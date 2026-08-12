import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export function AdminDashboard() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [accreditedHouses, setAccreditedHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch ALL profiles at once to prevent Supabase query conflicts
  const fetchData = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Admin Data Fetch Error:", error);
      alert(`Could not load dashboard data: ${error.message}`);
      setLoading(false);
      return;
    }

    if (data) {
      // 1. Filter pending applications (is_approved is false)
      const pending = data.filter((user) => user.is_approved === false);
      
      // 2. Filter approved caretaker houses for the shuttle route list
      const approvedHousesList = data.filter(
        (user) => user.role === 'caretaker' && user.is_approved === true
      );

      setPendingUsers(pending);
      setAccreditedHouses(approvedHousesList);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Approve a user application
  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: true })
      .eq('id', id);

    if (error) {
      alert(`Error approving user: ${error.message}`);
    } else {
      alert('Application approved successfully!');
      fetchData();
    }
  };

  // Remove or revoke an approved house
  const handleRemoveHouse = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this house from our shuttle route?')) {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: false })
        .eq('id', id);

      if (error) {
        alert(`Error removing house: ${error.message}`);
      } else {
        alert('House removed from active shuttle route.');
        fetchData();
      }
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600 font-medium">Loading Admin Control Panel...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Administrator Control Portal</h1>
        <p className="text-gray-600 text-sm">Manage pending driver/caretaker applications and oversee our accredited shuttle houses.</p>
      </div>

      {/* Section 1: Pending Applications */}
      <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-yellow-500">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Pending Account Approvals ({pendingUsers.length})</h2>
        {pendingUsers.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No pending approvals at the moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="p-3 border-b">Full Name</th>
                  <th className="p-3 border-b">Role</th>
                  <th className="p-3 border-b">Email</th>
                  <th className="p-3 border-b">Property / Details</th>
                  <th className="p-3 border-b text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="p-3 border-b font-medium">{user.full_name || 'N/A'}</td>
                    <td className="p-3 border-b uppercase text-xs font-semibold text-blue-600">{user.role}</td>
                    <td className="p-3 border-b text-gray-600">{user.email}</td>
                    <td className="p-3 border-b text-gray-600">
                      {user.role === 'caretaker' ? (
                        <>
                          <span className="font-semibold text-gray-900">{user.property_complex}</span> <br/>
                          <span className="text-xs">({user.unit_count} units, Tel: {user.phone})</span>
                        </>
                      ) : (
                        <span className="text-gray-500">Standard Driver</span>
                      )}
                    </td>
                    <td className="p-3 border-b text-center">
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-green-700 transition shadow-sm"
                      >
                        APPROVE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Accredited Shuttle Houses List */}
      <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-600">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Accredited Houses We Shuttle (Active Route)</h2>
        {accreditedHouses.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No accredited houses on the shuttle route yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="p-3 border-b">Complex / Residence</th>
                  <th className="p-3 border-b">Caretaker Name</th>
                  <th className="p-3 border-b">Contact Info</th>
                  <th className="p-3 border-b">Units</th>
                  <th className="p-3 border-b text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {accreditedHouses.map((house) => (
                  <tr key={house.id} className="hover:bg-gray-50">
                    <td className="p-3 border-b font-bold text-blue-900">{house.property_complex || 'Unnamed Complex'}</td>
                    <td className="p-3 border-b font-medium">{house.full_name}</td>
                    <td className="p-3 border-b text-gray-600">
                      <div>{house.phone || 'No phone'}</div>
                      <div className="text-xs text-gray-400">{house.email}</div>
                    </td>
                    <td className="p-3 border-b text-gray-600">{house.unit_count || 'N/A'}</td>
                    <td className="p-3 border-b text-center">
                      <button
                        onClick={() => handleRemoveHouse(house.id)}
                        className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-red-600 transition shadow-sm"
                      >
                        Remove House
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}