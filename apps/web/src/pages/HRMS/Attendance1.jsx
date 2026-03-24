import React, {useEffect, useState, useCallback} from "react";
import {Search, Plus, X, Wifi, WifiOff, RefreshCw} from "lucide-react";
import toast, {Toaster} from "react-hot-toast";

const API_BASE = process.env.React_APP_API_BASE_URL || "http://localhost:4000";

const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

const getCurrentUser = () => {
    try {return JSON.parse(localStorage.getItem("User") || "{}");} catch {return {}; }
};

const today = new Date().toISOString().slice(0,10);

const months = [
    "January","February", "March", "April", "May","June", "July","August","September","October", "November", "December"
];

export default function Attendance(){
    const isAdmin = getCurrentUser()?.role === "admin";
    const [attendance, setAttendance] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth() +1);
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());
    const[showModal, setShowModal] = useState(false);
    const  [editRecord, setEditRecord] = useState(null);

    //ZKTeco device state
    const [deviceStatus, setDeviceStatus] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);
    const [checkingDevice, setCheckingDevice] = useState(false);

    const [formData, setFormData] = useState({
        employee_id:"", date: today, status:"present",
        check_in: "", check_out:"", note:"",
    });

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        try{
            const daysInMonth = new Date(filterYear, filterMonth, 0).getDate();
            const from = `${filterYear}-${String(filterMonth).padStart(2, "0")}-01`;
            const to = `${filterYear}-${String(filterMonth).padStart(2, "0")}-${daysInMonth}`;
            const res = await fetch(`${API_BASE}/attendance?from=${from}&to=${to}`,{headers:getAuthHeaders()});

            if(!res.ok) throw new Error();
            const data = await res.json();
            setAttendance(data || []);
        } catch {toast.error("Could not load attendance");}
        finally {setLoading(false);}
    }, [filterMonth,filterYear]);

    const fetchEmployees = async () => {
        try{
            const res = await fetch(`${API_BASE}/employees`, {headers:getAuthHeaders()});
            if(!res.ok) throw new Error();
            const data = await res.json();
            setEmployees(data || []);
        }catch {}
    };

    useEffect(() => {fetchAttendance(); fetchEmployees();}, [fetchAttendance]);

    //ZKTeco functions
    const checkDeviceStatus = async () => {
        setCheckingDevice(true);
        try{
            const res = await fetch (`${API_BASE}/zkteco/ststus`,{headers: getAuthHeaders()});
            const data = await res.json();
            setDeviceStatus(data.connected ? "online" : "offline");
            if (!data.connected) toast.error("Device is offline or unreachable");
        }catch {
            setDeviceStatus("offline");
            toast.error("Could not reach device");
        }finally {
            setCheckingDevice(false);
        }
    };

    const syncDevice = async () => {
        setSyncing(true);
        const loadingToast = toast.loading("Syncing attendance from device ...");
        try{
            const res = await fetch (`${API_BASE}/zkteco/sync`,{
                method: "POST",
                headers: getAuthHeaders(),
            });
            if(!res.ok) throw new Error();
            const data = await res.json();
            toast.success(`Synced ${data.synced ?? 0} records from device!`, {id: loadingToast});
            setLastSync(new Date().toLocaleString());
            fetchAttendance();
        } catch {
            toast.error("Sync failed. Check device connection.", {id: loadingToast});
        }finally {
            setSyncing(false);
        }
    };

    //form handlers
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading(editRecord ? "Updating..." : "Saving...");
        try {
            const url = editRecord ? `${API_BASE}/attendance/${editRecord.id}`: `${API_BASE}/attendance`;
            const method = editRecord ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON>stringify(formData),
            });
            if(!res.ok) throw new Error ();
            toast.success(editRecord ? "Attendance updated!" : "Attendance marked!", {id: loadingToast});

            setShowModal(false);
            setEditRecord(null);
            setFormData({employee_id:"", date: today, status:"present", check_in:"", check_out:"", note: ""});
            fetchAttendance();
        } catch {toast.error("Failed to save attendance.", {id: loadingToast});}
    };

    const handleEdit = (record) => {
        setEditRecord(record);
        setFormData({
            employee_id: record.employee_id,
            date: record.date?.slice(0,10),
            status: record.status,
            check_in: record.check_in || "",
            note: record.note || "",
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this attendance record?")) return;
        try{
            const res = await fetch(`${API_BASE}/attendance/${id}`, {method: "DELETE", headers:getAuthHeaders()});
            if(!res.ok) throw new Error();
            toast.success("Record Deleted!");
            fetchAttendance();
        }catch {toast.error("Failed to delete record");}
    };

    //UI helpers

    const statusColors = {
        present: "bg-green-100 text-green-700",
        absent: "bg-red-100 text-red-700",
        half_day: "bg-yellow-100 text-yellow-700",
        leave: "bg-purple-100 text-purple-700",
        holiday: "bg-blue-100 text-blue-700",
    };

    const summary = {
        present: attendance.filter((a) => a.status === "present").length,
        absent: attendance.filter((a) => a.status === "absent").length,
        half_day: attendamce.filter((a) => "half_day").length,
        leave: attendance.filter((a) => a.status === "leave").length,
    };

    const filtered = attendance.filter((a) => 
        `${a.first_name} ${a.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.employee_number || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen p-6">
            <Toaster position = "top-right" reverseOrder={false} />

            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-semibold">Attendance</h2>
                    <p className="text-gray-500 text-sm">Track employee attendance</p>
                </div>

                <div className="flex gap-3 flex-wrap">
                 {isAdmin && (
            <>
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm bg-white">
                {deviceStatus === "online" ? (
                  <><Wifi size={14} className="text-green-500" /><span className="text-green-600 font-medium">Device Online</span></>
                ) : deviceStatus === "offline" ? (
                  <><WifiOff size={14} className="text-red-500" /><span className="text-red-500 font-medium">Device Offline</span></>
                ) : (
                  <><Wifi size={14} className="text-gray-400" /><span className="text-gray-400">Device Unknown</span></>
                )}
              </div>
 
              {/* Check Status Button */}
              <button
                onClick={checkDeviceStatus}
                disabled={checkingDevice}
                className="flex items-center gap-2 border px-3 py-2 rounded-lg text-sm hover:bg-gray-50 bg-white">
                <RefreshCw size={14} className={checkingDevice ? "animate-spin" : ""} />
                {checkingDevice ? "Checking..." : "Check Device"}
              </button>

              <button onClick={syncDevice} disabled={syncing} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                <RefreshCw size={14} className={syncing ? "animate-spin" : ""}/>
                {syncing ? "Syncing..." : "Sync Device"}
              </button>
              </>
                 )}

                 <button onClick={() => {setEditRecord(null); setFormData({ employee_id: "", date: today, status:"present", check_in:"", check_out:"",note:""}); setShowModal(true);}} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-900 shadow-md">
                    <Plus size = {16} /> Mark Attendance
                 </button>
                </div>
            </div>

            {lastSync && (
                <div className="mb-4 text-xs text-gray-400 text-right">
                    Last synced: {lastSync}
                </div>
            )}

            <div className="grid grid-cols-2 md-grid:cols-4 gap-4 mb-6">
                {[
                    {label:"Present", count: summary.present, color:"bg-green-50 text-green-700 border-green-100"},
                    {label:"Absent", count:summary.absent, color: "bg-red-50 text-red-700 border-red-100"},
                    {label:"Half Day", count:summary.half_day, color: "bg-yellow-50 text-yellow-700, border-yellow-100"},
                    {label:"On Leave", count: summary.leave, color: "bg-purple-50 text-purple-700 border-purple-100"},
                ].map(({label,count,color}) => (
                    <div key={label} className={`bg-white rounded-xl border p-4 shadow-sm ${color}`}>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</p>
                        <p className="text-2xl font-bold mt-1">{count}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                    <div>
                        <h3 className="font0semibold">Attendance Records</h3>
                        <p className="text-sm text-gray-400">{filtered.length} record{filtered.length !==1 ? "s" : ""}</p>
                    </div>
                    <div className="flex gap-3 items-center flex-wrap">
                        <select className="border rounded-lg px-3 py-2 text-sm" value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}>
                            {months.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                        </select>
                        <input type = "number" className="border rounded-lg px-3 py-2 text-sm w-24" alue={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}/>

                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input type="text" placeholder="Search employees" className="pl-9 pr-4 py-2 border rounded-lg text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
                        </div>
                    </div>
                </div>
{loading ? (
          <p className="text-gray-500 py-10 text-center">Loading attendance...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3">Emp No.</th>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Source</th>
                  <th>Note</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="9" className="text-center py-10 text-gray-400">No attendance records found</td></tr>
                ) : (
                  filtered.map((record) => (
                    <tr key={record.id} className="border-b last:border-none hover:bg-gray-50">
                      <td className="py-3 font-mono text-xs text-gray-500">{record.employee_number}</td>
                      <td className="font-medium">{record.first_name} {record.last_name}</td>
                      <td>{record.date?.slice(0, 10)}</td>
                      <td>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[record.status] || "bg-gray-100"}`}>
                          {record.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td>{record.check_in || "—"}</td>
                      <td>{record.check_out || "—"}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${record.source === "device" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                          {record.source === "device" ? "🔴 Device" : "✏️ Manual"}
                        </span>
                      </td>
                      <td className="text-gray-500">{record.note || "—"}</td>
                      {isAdmin && (
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(record)} className="text-xs text-blue-600 hover:underline">Edit</button>
                            <button onClick={() => handleDelete(record.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
 
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editRecord ? "Edit Attendance" : "Mark Attendance"}</h3>
              <button onClick={() => { setShowModal(false); setEditRecord(null); }} className="text-gray-400 hover:text-black"><X size={18} /></button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {!editRecord && (
                <select name="employee_id" className="border p-2 rounded w-full text-gray-700" onChange={handleChange} value={formData.employee_id} required>
                  <option value="">Select Employee</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_number})</option>)}
                </select>
              )}
              <input name="date" type="date" className="border p-2 rounded w-full" onChange={handleChange} value={formData.date} required />
              <select name="status" className="border p-2 rounded w-full text-gray-700" onChange={handleChange} value={formData.status}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="leave">Leave</option>
                <option value="holiday">Holiday</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Check In</label>
                  <input name="check_in" type="time" className="border p-2 rounded w-full" onChange={handleChange} value={formData.check_in} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Check Out</label>
                  <input name="check_out" type="time" className="border p-2 rounded w-full" onChange={handleChange} value={formData.check_out} />
                </div>
              </div>
              <input name="note" type="text" placeholder="Note (optional)" className="border p-2 rounded w-full" onChange={handleChange} value={formData.note} />
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditRecord(null); }} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black text-white rounded">{editRecord ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}