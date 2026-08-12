import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export function CaretakerDashboard({ caretakerId }: { caretakerId: string }) {
  const [caretakerProfile, setCaretakerProfile] = useState<any>(null);
  const [boardedStudents, setBoardedStudents] = useState<any[]>([]);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCaretakerData = async () => {
    setLoading(true);
    
    // 1. Fetch caretaker profile to get property complex name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', caretakerId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching caretaker profile:', profileError);
      setLoading(false);
      return;
    }

    setCaretakerProfile(profile);

    // 2. Fetch all students registered under this caretaker's property complex
    const { data: students, error: studentError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .eq('assigned_complex', profile.property_complex);

    if (!studentError && students) {
      // Separate students into pending and active/approved
      const pending = students.filter((s) => s.is_approved === false);
      const approved = students.filter((s) => s.is_approved === true);

      setPendingStudents(pending);
      setBoardedStudents(approved);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (caretakerId) {
      fetchCaretakerData();
    }
  }, [caretakerId]);

  // Handle Approve Student Application
  const handleApproveStudent = async (id: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: true })
      .eq('id', id);

    if (error) {
      alert(`Error approving student: ${error.message}`);
    } else {
      alert('Student boarding application approved successfully!');
      fetchCaretakerData();
    }
  };

  // Handle Reject / Remove Student Application
  const handleRejectStudent = async (id: string) => {
    if (window.confirm('Are you sure you want to reject or remove this student from your residence?')) {
      const { error } = await supabase
        .from('profiles')
        .delete() // Deletes or resets application so they can re-apply
        .eq('id', id);

      if (error) {
        alert(`Error rejecting student: ${error.message}`);
      } else {
        alert('Student application rejected.');
        fetchCaretakerData();
      }
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600 font-medium">Loading Caretaker Portal...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Caretaker Overview Header */}
      <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-600">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Caretaker Portal: {caretakerProfile?.property_complex}</h1>
        <p className="text-gray-600 text-sm">Managing residence accommodations, student applications, and shuttle coordination.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <p className="text-xs text-yellow-700 font-semibold uppercase">Pending Student Requests</p>
            <p className="text-2xl font-bold text-yellow-900 mt-1">{pendingStudents.length}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-600 font-semibold uppercase">Active Boarded Students</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{boardedStudents.length}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 font-semibold uppercase">Total History Trips</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">248</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <p className="text-xs text-green-600 font-semibold uppercase">Average Driver Ratings</p>
            <p className="text-2xl font-bold text-green-900 mt-1">4.8 / 5.0 ⭐</p>
          </div>
        </div>
      </div>

      {/* Section 1: Pending Student Applications */}
      <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-yellow-500">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Pending Student Applications ({pendingStudents.length})</h2>
        {pendingStudents.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No pending student applications for your complex right now.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="p-3 border-b">Student Name</th>
                  <th className="p-3 border-b">Room Number</th>
                  <th className="p-3 border-b">Contact Phone</th>
                  <th className="p-3 border-b">Email Address</th>
                  <th className="p-3 border-b text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="p-3 border-b font-medium text-gray-900">{student.full_name || 'N/A'}</td>
                    <td className="p-3 border-b font-bold text-blue-700">{student.room_number || 'Unassigned'}</td>
                    <td className="p-3 border-b text-gray-600">{student.phone || 'No phone'}</td>
                    <td className="p-3 border-b text-gray-600">{student.email}</td>
                    <td className="p-3 border-b text-center space-x-2">
                      <button
                        onClick={() => handleApproveStudent(student.id)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectStudent(student.id)}
                        className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-red-600 transition"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Active Boarded Students Directory */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Active Boarded Students Directory</h2>
        {boardedStudents.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No approved students currently active under this housing complex.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="p-3 border-b">Student Name</th>
                  <th className="p-3 border-b">Room Number</th>
                  <th className="p-3 border-b">Contact Phone</th>
                  <th className="p-3 border-b">Email Address</th>
                  <th className="p-3 border-b text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {boardedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="p-3 border-b font-medium text-gray-900">{student.full_name || 'N/A'}</td>
                    <td className="p-3 border-b font-bold text-blue-700">{student.room_number || 'Unassigned'}</td>
                    <td className="p-3 border-b text-gray-600">{student.phone || 'No phone'}</td>
                    <td className="p-3 border-b text-gray-600">{student.email}</td>
                    <td className="p-3 border-b text-center">
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded">
                        Active Boarder
                      </span>
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