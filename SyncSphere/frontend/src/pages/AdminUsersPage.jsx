import React, { useState } from 'react';
import { UserCheck, Shield, Search, UserX, Mail, Calendar } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';

const AdminUsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Sample users list for Admin view
  const [users, setUsers] = useState([
    {
      id: 1,
      fullName: 'System Administrator',
      email: 'admin@syncsphere.local',
      role: 'ADMIN',
      createdAt: '2026-10-01',
      status: 'ACTIVE',
    },
    {
      id: 2,
      fullName: 'Sarah K.',
      email: 'sarah.k@company.com',
      role: 'USER',
      createdAt: '2026-10-05',
      status: 'ACTIVE',
    },
    {
      id: 3,
      fullName: 'Alex M.',
      email: 'alex.m@company.com',
      role: 'USER',
      createdAt: '2026-10-10',
      status: 'ACTIVE',
    },
  ]);

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <Shield className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            System administration console: manage user accounts, permissions, and access status.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <th className="p-3.5">User</th>
              <th className="p-3.5">System Role</th>
              <th className="p-3.5">Registered</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="p-3.5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs">
                      {u.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{u.fullName}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'ADMIN'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-3.5 text-slate-500">{u.createdAt}</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {u.status}
                  </span>
                </td>
                <td className="p-3.5 text-right space-x-2">
                  <button className="text-brand-600 hover:text-brand-800 font-medium">
                    Edit
                  </button>
                  {u.role !== 'ADMIN' && (
                    <button className="text-red-500 hover:text-red-700 font-medium">
                      Suspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage;
