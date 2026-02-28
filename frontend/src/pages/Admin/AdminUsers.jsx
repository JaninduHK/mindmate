import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import Loading from '../../components/common/Loading';
import { format } from 'date-fns';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listUsers({ search, limit: 50 });
      if (res.success) setUsers(res.data.users);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [search]);

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>
      <input
        type="text"
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-5 w-full max-w-sm border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      {loading ? <Loading /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full capitalize">{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
