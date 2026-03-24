import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { 
  ShieldAlert, Activity, Server, PackageSearch, Loader2, 
  Settings, Bell, HelpCircle, Grid, Search, Filter, AlertCircle,
  LayoutDashboard, FileText, ChevronDown, ChevronRight, Check, Columns, Download, ArrowRight, X,
  Scan, Bug, Globe, Box, Radio, Wifi, Shield, Eye, Database, Layers, Menu, Clock, RotateCw, ListFilter,
  IterationCcw, ExternalLink
} from 'lucide-react';
import LoginPage from './components/LoginPage';

// --- SIDEBAR NAV CONFIG (Tenable Style) ---
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboards', icon: LayoutDashboard, hasSubmenu: true },
  { id: 'scans', label: 'Scans', icon: Scan, hasSubmenu: true, disabled: true },
  { id: 'vuln-intel', label: 'Vulnerability Intelligence', icon: Bug, disabled: true },
  { id: 'exposure', label: 'Exposure Response', icon: Shield, hasSubmenu: true, disabled: true },
  { id: 'explore', label: 'Explore', icon: Eye, hasSubmenu: true, badge: 'NEW' },
  { id: 'solutions', label: 'Solutions', icon: PackageSearch, hasSubmenu: true, disabled: true },
  { id: 'sensors', label: 'Sensors', icon: Radio, hasSubmenu: true, disabled: true },
  { id: 'reports', label: 'Reports', icon: FileText, hasSubmenu: true, disabled: true },
  { id: 'exports', label: 'Exports', icon: Download, hasSubmenu: true, disabled: true },
  { id: 'remediation', label: 'Remediation', icon: Activity, hasSubmenu: true, disabled: true },
  { id: 'container', label: 'Container Security Legacy', icon: Box, hasSubmenu: true, disabled: true },
  { type: 'divider' },
  { id: 'settings', label: 'Settings', icon: Settings, disabled: true },
];

// --- MAIN APP COMPONENT ---
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isScanning, setIsScanning] = useState(false);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [accountsList, setAccountsList] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarHoverItem, setSidebarHoverItem] = useState(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/api/accounts')
      .then(response => {
        setAccountsList(response.data);
        if (response.data.length > 0) setSelectedAccount(response.data[0].display_name); 
      })
      .catch(error => console.error(error));
    fetchDashboardData();
  }, []);

  const fetchDashboardData = () => {
    axios.get('http://127.0.0.1:5000/api/vulnerabilities').then(res => setVulnerabilities(res.data)).catch(console.error);
  };

  const handleTriggerScan = () => {
    if (!selectedAccount) return;
    setIsScanning(true);
    axios.post('http://127.0.0.1:5000/api/scan', { account_name: selectedAccount })
      .then(() => fetchDashboardData())
      .finally(() => setTimeout(() => setIsScanning(false), 800));
  };

  const filteredVulns = useMemo(() => {
    return vulnerabilities
      .filter(v => v.account_name === selectedAccount)
      .filter(v => searchQuery ? (v.id + v.package + v.workload).toLowerCase().includes(searchQuery.toLowerCase()) : true);
  }, [vulnerabilities, selectedAccount, searchQuery]);

  const stats = useMemo(() => ({
    Critical: filteredVulns.filter(v => (v.severity || '').toUpperCase() === 'CRITICAL').length,
    High: filteredVulns.filter(v => (v.severity || '').toUpperCase() === 'HIGH').length,
    Medium: filteredVulns.filter(v => (v.severity || '').toUpperCase() === 'MEDIUM').length,
    Low: filteredVulns.filter(v => (v.severity || '').toUpperCase() === 'LOW').length,
    Total: filteredVulns.length
  }), [filteredVulns]);

  if (!isAuthenticated) return <LoginPage onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex flex-col h-screen bg-[#0d121f] text-slate-200 font-sans overflow-hidden">
      
      {/* ═══════ TOP HEADER ═══════ */}
      <header className="h-[50px] bg-[#161c2d] border-b border-slate-800/60 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-blue-500">
               <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
               <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="font-bold text-base text-white tracking-tight">trigo</span>
            <span className="text-slate-600 font-light mx-1">|</span>
            <span className="text-slate-400 font-medium text-[13px]">Vulnerability Management</span>
            <span className="text-slate-600 font-light mx-1">|</span>
            <span className="text-slate-100 font-medium text-[13px] capitalize">Explore</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-slate-400">
          <div className="flex items-center gap-2 mr-3 border border-slate-700 rounded-full px-4 py-1.5 bg-[#1e273a] hover:bg-slate-700/50 transition-colors cursor-pointer group">
             <Search size={14} className="text-slate-500 group-hover:text-blue-400" />
             <select 
               value={selectedAccount} 
               onChange={(e) => setSelectedAccount(e.target.value)}
               className="bg-transparent text-[12px] font-semibold text-slate-200 outline-none cursor-pointer border-none p-0 focus:ring-0 appearance-none"
             >
               {accountsList.map((acc, idx) => (
                 <option key={idx} value={acc.display_name} className="bg-[#1e273a]">{acc.display_name}</option>
               ))}
             </select>
             <ChevronDown size={12} className="text-slate-500" />
          </div>

          <IconButton icon={HelpCircle} />
          <IconButton icon={Bell} badge />
          <IconButton icon={Settings} />
          <button onClick={() => setIsAuthenticated(false)} className="ml-2 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer border border-blue-400/20">YP</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* ═══════ SIDEBAR ═══════ */}
        <aside 
          className={`bg-[#161c2d] border-r border-slate-800/60 flex flex-col shrink-0 z-40 transition-all duration-300 ease-in-out overflow-hidden shadow-2xl ${
            sidebarOpen ? 'w-[240px]' : 'w-0'
          }`}
        >
          <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
            {NAV_ITEMS.map((item, idx) => {
              if (item.type === 'divider') return <div key={idx} className="my-2 mx-4 border-t border-slate-800/50" />;
              
              const isActive = (activeTab === item.id) || 
                (item.id === 'explore' && (activeTab === 'assets' || activeTab === 'findings'));

              return (
                <div key={item.id} className="relative"
                  onMouseEnter={() => setSidebarHoverItem(item.id)}
                  onMouseLeave={() => setSidebarHoverItem(null)}
                >
                  <button
                    onClick={() => {
                      if (!item.disabled) {
                        if (item.id === 'explore') setActiveTab('assets');
                        else setActiveTab(item.id);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-[9px] text-[13px] font-medium transition-all relative group
                      ${item.disabled ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:bg-[#1e273a] hover:text-white cursor-pointer'}
                      ${isActive ? 'text-white bg-[#1e273a] font-semibold' : ''}
                    `}
                  >
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-blue-500 rounded-r-sm" />}
                    <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'} />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge && <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[9px] font-bold rounded-sm uppercase tracking-wide">{item.badge}</span>}
                    {item.hasSubmenu && !item.disabled && <ChevronRight size={14} className="text-slate-600 opacity-60 group-hover:opacity-100" />}
                  </button>
                  
                  {item.id === 'explore' && sidebarHoverItem === 'explore' && (
                    <>
                      <div className="absolute left-full top-0 w-2 h-full z-50" />
                      <div className="absolute left-full top-0 ml-1 bg-[#1e273a] border border-slate-800 rounded-md shadow-2xl py-1 w-[160px] z-50">
                        <button
                          onClick={() => { setActiveTab('assets'); setSidebarHoverItem(null); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition-colors ${activeTab === 'assets' ? 'text-blue-400 font-semibold' : 'text-slate-300'}`}
                        >
                          Assets
                        </button>
                        <button
                          onClick={() => { setActiveTab('findings'); setSidebarHoverItem(null); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition-colors ${activeTab === 'findings' ? 'text-blue-400 font-semibold' : 'text-slate-300'}`}
                        >
                          Findings
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ═══════ MAIN CONTENT ═══════ */}
        <main className="flex-1 overflow-y-auto w-full transition-all bg-[#0d121f]">
          {activeTab === 'dashboard' && (
            <ExposureDashboard stats={stats} isScanning={isScanning} onScan={handleTriggerScan} vulns={filteredVulns} />
          )}
          {activeTab === 'assets' && (
            <AssetsExplore vulns={filteredVulns} setActiveTab={setActiveTab} />
          )}
          {(activeTab === 'findings' || activeTab === 'explore') && (
            <FindingsExplore vulns={filteredVulns} searchQuery={searchQuery} setSearchQuery={setSearchQuery} setActiveTab={setActiveTab} />
          )}
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// ASSETS EXPLORE (Matching Tenable UI)
// ═══════════════════════════════════════════════

function AssetsExplore({ vulns, setActiveTab }) {
  const assets = useMemo(() => {
    const assetMap = {};
    vulns.forEach(v => {
      if (!assetMap[v.workload]) {
        assetMap[v.workload] = { name: v.workload, vulnCount: 0, critCount: 0, highCount: 0, account: v.account_name, lastSeen: '05/15/2025' };
      }
      assetMap[v.workload].vulnCount++;
      if ((v.severity || '').toUpperCase() === 'CRITICAL') assetMap[v.workload].critCount++;
    });
    return Object.values(assetMap);
  }, [vulns]);

  return (
    <div className="h-full flex flex-col">
      <TabHeader active="assets" onTabChange={setActiveTab} />
      <QueryBar />

      <div className="flex flex-1 overflow-hidden px-4 pb-4">
        <div className="flex-1 flex bg-[#161c2d] border border-slate-800 rounded-lg overflow-hidden">
          <ExplorerSidebar type="assets" count={assets.length} />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Toolbar count={assets.length} label="Hosts" />
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[#161c2d] z-10 border-b border-slate-800">
                  <tr className="text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 w-10"><input type="checkbox" className="rounded border-slate-700 bg-transparent text-blue-600 focus:ring-0" /></th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-3 text-center">AES</th>
                    <th className="py-3 px-3 text-center">ACR</th>
                    <th className="py-3 px-4">IPv4 Address</th>
                    <th className="py-3 px-4">Operating Sy...</th>
                    <th className="py-3 px-4">Last Seen</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-2.5 px-4 text-right">Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {assets.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 text-slate-300 transition-colors group">
                      <td className="py-3 px-4"><input type="checkbox" className="rounded border-slate-700 bg-transparent text-blue-600 focus:ring-0" /></td>
                      <td className="py-3 px-4 font-medium text-slate-200">{a.name}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-10 py-1 rounded-full bg-amber-600/20 text-amber-500 font-bold border border-amber-500/30">
                          {500 + i * 20}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-600/20 text-red-500 font-bold border border-red-500/30">8</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">172.26.115.11</td>
                      <td className="py-3 px-4 text-slate-400">Ubuntu Lin...</td>
                      <td className="py-3 px-4 text-slate-400">{a.lastSeen}</td>
                      <td className="py-3 px-4">
                         <Box size={14} className="text-blue-500 inline mr-2 opacity-70" />
                         <span className="text-[10px] uppercase font-bold text-slate-500">Trivy</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-500 border border-slate-700">mzt + {2+i} mo</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination count={assets.length} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// FINDINGS EXPLORE (Matching screenshot exactly)
// ═══════════════════════════════════════════════

function FindingsExplore({ vulns, setActiveTab }) {
  return (
    <div className="h-full flex flex-col">
      <TabHeader active="findings" onTabChange={setActiveTab} />
      <QueryBar findingsView />

      <div className="flex flex-1 overflow-hidden px-4 pb-4">
        <div className="flex-1 flex bg-[#161c2d] border border-slate-800 rounded-lg overflow-hidden">
          <ExplorerSidebar type="findings" count={vulns.length} />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Toolbar count={vulns.length} label="Vulnerabilities" />
            
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="sticky top-0 bg-[#161c2d] z-10 border-b border-slate-800 shadow-sm">
                  <tr className="text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 w-10"><input type="checkbox" className="rounded border-slate-700 bg-transparent text-blue-600 focus:ring-0" /></th>
                    <th className="py-3 px-4">Asset</th>
                    <th className="py-3 px-4">IPv4 Address</th>
                    <th className="py-3 px-2">Severity</th>
                    <th className="py-3 px-4">Plugin Name</th>
                    <th className="py-3 px-2">VPRv2</th>
                    <th className="py-3 px-2">CVSS...</th>
                    <th className="py-3 px-2">EPSS</th>
                    <th className="py-3 px-4">State</th>
                    <th className="py-3 px-4 text-right">Last...</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {vulns.length === 0 ? (
                    <tr><td colSpan="10" className="py-20 text-center text-slate-500 font-medium">No findings recorded. Execute a triage scan.</td></tr>
                  ) : (
                    vulns.map((v, i) => (
                      <tr key={i} className="hover:bg-slate-800/40 text-slate-300 transition-colors cursor-default group border-l-[3px] border-transparent hover:border-blue-500/40">
                        <td className="py-2.5 px-4"><input type="checkbox" className="rounded border-slate-700 bg-transparent text-blue-600 focus:ring-0" /></td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-100 font-medium">{v.workload.substring(0, 8)}...</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">10.0.1.25</td>
                        <td className="py-2.5 px-2">
                           <SeverityIcon severity={v.severity} />
                        </td>
                        <td className="py-2.5 px-4">
                           <div className="flex items-center gap-2">
                             <span className="text-blue-400 hover:text-blue-300 cursor-pointer">{v.cve_id || v.id}</span>
                             <HelpCircle size={10} className="text-slate-600 opacity-60" />
                           </div>
                        </td>
                        <td className="py-2.5 px-2">
                           <ScoreBadge score={9.5 - (i * 0.1)} />
                        </td>
                        <td className="py-2.5 px-2">
                           <span className="text-slate-100 font-bold">10</span>
                        </td>
                        <td className="py-2.5 px-2 transition-opacity opacity-70 group-hover:opacity-100">
                           <span className="font-mono text-[10px] text-slate-500">{92 - i}.5...</span>
                        </td>
                        <td className="py-2.5 px-4">
                           <div className="flex items-center gap-2">
                             <span className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px] text-slate-400">New</span>
                             <Clock size={12} className="text-blue-500/60" />
                           </div>
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-500">05/1...</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination count={vulns.length} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SUB-COMPONENTS (CONCISE HELPERS)
// ═══════════════════════════════════════════════

function TabHeader({ active, onTabChange }) {
  return (
    <div className="flex items-center gap-1 px-4 pt-1 bg-[#0d121f]">
      <button 
        onClick={() => onTabChange('assets')}
        className={`px-4 py-2 text-[13px] font-semibold transition-all border-b-2 flex items-center gap-2
          ${active === 'assets' ? 'text-blue-400 border-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.1)]' : 'text-slate-500 border-transparent hover:text-slate-300'}
        `}
      >
        <Database size={14} /> Assets
      </button>
      <button 
        onClick={() => onTabChange('findings')}
        className={`px-4 py-2 text-[13px] font-semibold transition-all border-b-2 flex items-center gap-2
          ${active === 'findings' ? 'text-blue-400 border-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.1)]' : 'text-slate-500 border-transparent hover:text-slate-300'}
        `}
      >
        <ShieldAlert size={14} /> Findings
      </button>
    </div>
  );
}

function QueryBar({ findingsView }) {
  return (
    <div className="px-4 py-3 bg-[#0d121f] flex items-center gap-3">
      <div className="flex bg-[#161c2d] border border-slate-800 rounded-lg p-1 w-full max-w-[1200px] items-center">
        <button className="flex items-center gap-2 px-3 py-1.5 text-slate-400 text-xs font-semibold hover:text-white border-r border-slate-800">
          Saved Queries <ChevronDown size={12} />
        </button>
        <div className="flex-1 flex gap-2 px-3 overflow-x-auto no-scrollbar">
           <FilterPill label="Last Seen" operator="within last" value="30 days" color="text-purple-400" bg="bg-purple-400/10" />
           {findingsView && (
             <>
               <span className="text-slate-600 text-[10px] font-bold self-center">AND</span>
               <FilterPill label="Risk Modified" operator="is not equal to" value="Accepted" color="text-teal-400" bg="bg-teal-400/10" />
               <span className="text-slate-600 text-[10px] font-bold self-center">AND</span>
               <FilterPill label="Severity" operator="is equal to" value="Low, Medium, High, Critical" color="text-emerald-400" bg="bg-emerald-400/10" />
             </>
           )}
           <span className="text-slate-600 text-[10px] font-bold self-center">AND ...</span>
        </div>
        <div className="pr-2 pl-4 border-l border-slate-800 flex items-center gap-3">
          <button className="p-1 hover:text-white text-slate-500 transition-colors"><Search size={14} /></button>
          <div className="h-4 w-px bg-slate-800" />
          <button className="text-[11px] font-semibold text-slate-500 hover:text-white whitespace-nowrap">Reset Queries</button>
        </div>
      </div>
    </div>
  );
}

function FilterPill({ label, operator, value, color, bg }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 ${bg} border border-${color.split('-')[1]}-500/20 rounded-full shrink-0 group`}>
      <span className={`text-[11px] font-bold ${color}`}>{label}</span>
      <span className="text-[11px] text-slate-400 opacity-80 whitespace-nowrap">{operator}</span>
      <span className="text-[11px] text-white font-semibold whitespace-nowrap">{value}</span>
      <X size={10} className="text-slate-500 hover:text-white cursor-pointer ml-1" />
    </div>
  );
}

function ExplorerSidebar({ type, count }) {
  return (
    <div className="w-[220px] border-r border-slate-800 bg-[#161c2d] flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          {type === 'assets' ? <Database size={12}/> : <Shield size={12}/>}
          {type === 'assets' ? 'All Assets' : 'Vulnerabilities'}
        </span>
        <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">{count}</span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 px-1">
         <FilterGroup title="By VPR">
           <div className="pl-3">
            <SidebarFilterItem label="Critical" count={Math.floor(count*0.1)} dot="bg-red-500" />
            <SidebarFilterItem label="High" count={Math.floor(count*0.3)} dot="bg-orange-500" />
            <SidebarFilterItem label="Medium" count={Math.floor(count*0.4)} dot="bg-amber-500" />
            <SidebarFilterItem label="Low" count={Math.floor(count*0.1)} dot="bg-blue-500" />
            <SidebarFilterItem label="None" count={0} dot="bg-slate-500" />
           </div>
         </FilterGroup>
         <FilterGroup title="By Severity">
           <div className="pl-3">
            <SidebarFilterItem label="Critical" count={Math.floor(count*0.2)} dot="bg-red-500" />
            <SidebarFilterItem label="High" count={Math.floor(count*0.4)} dot="bg-orange-500" active />
            <SidebarFilterItem label="Medium" count={Math.floor(count*0.2)} dot="bg-amber-500" />
            <SidebarFilterItem label="Low" count={Math.floor(count*0.1)} dot="bg-blue-500" />
            <SidebarFilterItem label="Info" count={0} dot="bg-slate-400" />
           </div>
         </FilterGroup>
         <FilterGroup title="By State">
           <div className="pl-3">
            <SidebarFilterItem label="New" count={Math.floor(count*0.9)} dot="bg-blue-500/50" />
            <SidebarFilterItem label="Active" count={Math.floor(count*0.05)} dot="bg-emerald-500/50" />
            <SidebarFilterItem label="Fixed" count={0} dot="bg-slate-500" />
           </div>
         </FilterGroup>
      </div>
    </div>
  );
}

function Toolbar({ count, label }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#161c2d] shadow-sm relative z-[1]">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold pr-3 border-r border-slate-800 uppercase tracking-tighter self-center">
          Group By
          <div className="flex gap-0.5 ml-1">
             <div className="p-1 rounded text-slate-500 hover:text-white cursor-pointer"><RotateCw size={12}/></div>
             <div className="p-1 rounded text-slate-500 hover:text-white cursor-pointer"><Layers size={13}/></div>
             <div className="p-1 rounded text-slate-500 hover:text-white cursor-pointer"><ExternalLink size={12}/></div>
             <div className="p-1 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30"><Grid size={13}/></div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-[11px] font-medium">
          <input type="checkbox" className="rounded border-slate-700 bg-transparent text-blue-600 focus:ring-0 mr-1" />
          <span className="text-slate-100 font-bold">{count.toLocaleString()}</span> {label}
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">Fetched At: 1:49 PM</span>
          <button className="flex items-center gap-1 hover:text-white transition-colors text-blue-400 font-semibold"><RotateCw size={11}/> Refresh</button>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
         <button className="flex items-center gap-1.5 hover:text-white px-2 py-1 transition-colors uppercase tracking-tight"><Columns size={13}/> Columns</button>
         <div className="h-4 w-px bg-slate-800" />
         <span className="text-slate-400">1 to {Math.min(50, count)} of {count.toLocaleString()}</span>
         <div className="flex gap-2 ml-1 text-slate-600">
            <ChevronRight size={16} className="rotate-180 opacity-30 cursor-not-allowed"/>
            <ChevronRight size={16} className="opacity-100 cursor-pointer hover:text-white"/>
         </div>
         <div className="h-4 w-px bg-slate-800" />
         <div className="flex items-center gap-2">
            <span className="text-slate-400">Page 1 of {Math.ceil(count/50)}</span>
            <ChevronDown size={14} className="hover:text-white cursor-pointer"/>
         </div>
      </div>
    </div>
  );
}

function Pagination({ count }) {
  return (
    <div className="h-10 border-t border-slate-800 bg-[#161c2d] flex items-center justify-between px-4 text-xs text-slate-500 shrink-0">
      <span className="font-semibold text-white">Page 1 of {Math.ceil(count/50) || 1}</span>
      <div className="flex items-center gap-2">
        <button className="px-2 py-1 border border-slate-800 rounded opacity-30 cursor-not-allowed">First</button>
        <button className="px-2 py-1 border border-slate-800 rounded opacity-30 cursor-not-allowed">Prev</button>
        <div className="flex gap-1 h-6 items-center px-4 bg-slate-800/50 rounded border border-slate-800">
           <span className="text-white font-bold">1</span>
        </div>
        <button className="px-2 py-1 border border-slate-800 rounded hover:bg-slate-800 hover:text-white">Next</button>
        <button className="px-2 py-1 border border-slate-800 rounded hover:bg-slate-800 hover:text-white">Last</button>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-1">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] hover:bg-slate-800/30">
        <span className="flex items-center gap-2">{open ? <ChevronDown size={10}/> : <ChevronRight size={10}/>} {title}</span>
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}

function SidebarFilterItem({ label, count, active, dot, highlight }) {
  return (
    <div className={`w-full flex items-center justify-between px-7 py-1.5 text-[12px] group cursor-pointer transition-colors
      ${active ? 'bg-blue-600/10 text-blue-400 font-bold border-r-2 border-blue-500' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
    `}>
      <div className="flex items-center gap-2">
        {dot && <div className={`w-2 h-2 rounded-full ${dot} shadow-[0_0_8px_currentColor] border border-white/10`} />}
        <span className="truncate">{label}</span>
        {highlight && <Info size={10} className="text-blue-500 opacity-50 group-hover:opacity-100" />}
      </div>
      <span className={`text-[10px] font-bold ${active ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`}>{count.toLocaleString()}</span>
    </div>
  );
}

function SeverityIcon({ severity }) {
  const s = (severity || '').toUpperCase();
  if (s === 'CRITICAL') return <div className="flex items-center gap-1.5 text-red-500 font-extrabold"><ShieldAlert size={14} fill="currentColor" fillOpacity={0.2} strokeWidth={2.5}/> <span className="text-[10px] uppercase">Cri</span> <HelpCircle size={10} className="text-slate-700"/></div>;
  if (s === 'HIGH') return <div className="flex items-center gap-1.5 text-orange-500 font-extrabold"><ShieldAlert size={14} fill="currentColor" fillOpacity={0.2} strokeWidth={2.5}/> <span className="text-[10px] uppercase">Hig</span> <HelpCircle size={10} className="text-slate-700"/></div>;
  if (s === 'MEDIUM') return <div className="flex items-center gap-1.5 text-amber-500 font-extrabold"><ShieldAlert size={14} fill="currentColor" fillOpacity={0.2} strokeWidth={2.5}/> <span className="text-[10px] uppercase">Med</span> <HelpCircle size={10} className="text-slate-700"/></div>;
  return <div className="flex items-center gap-1.5 text-blue-500 font-extrabold"><ShieldAlert size={14} fill="currentColor" fillOpacity={0.2} strokeWidth={2.5}/> <span className="text-[10px] uppercase">Low</span> <HelpCircle size={10} className="text-slate-700"/></div>;
}

function ScoreBadge({ score }) {
  const colorClass = score >= 9 ? 'bg-red-900/30 text-red-500 border-red-500/40' : score >= 7 ? 'bg-orange-900/30 text-orange-500 border-orange-500/40' : 'bg-amber-900/30 text-amber-500 border-amber-500/40';
  return <span className={`inline-flex items-center justify-center w-7 h-7 rounded-sm text-[10px] font-bold border ${colorClass}`}>{score.toFixed(1)}</span>;
}

function Network({ size, className }) { return <Activity size={size} className={className}/>; }
function ChevronLeft({ size, className }) { return <ChevronRight size={size} className={`${className} rotate-180`}/>; }
function Info({ size, className }) { return <AlertCircle size={size} className={className}/>; }

// --- REST OF THE COMPONENTS (DASHBOARD/CARDS) FROM PREVIOUS BUILD ---
// I am keeping the logic from before for stats but updating styles to dark.

function ExposureDashboard({ stats, isScanning, onScan, vulns }) {
  const heatmapData = [[1801, 984, 402, 1462], [0, 0, 3, 0], [1910, 1041, 706, 1536], [2635, 1067, 741, 1850]];
  const calculatedScore = Math.min(1000, 502 + (stats.Critical * 10) + (stats.High * 5));

  return (
    <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-2xl font-bold text-white tracking-tight">Exposure Management Home</h1>
           <p className="text-slate-500 text-sm mt-1">Unified view of security posture across AWS accounts.</p>
        </div>
        <button 
          onClick={onScan} disabled={isScanning}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
        >
          {isScanning ? <Loader2 size={16} className="animate-spin" /> : <Scan size={16} />}
          {isScanning ? 'Vulnerability Scan in Progress...' : 'Launch Global Scan'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#161c2d] rounded-xl border border-slate-800 p-8 shadow-xl">
           <div className="flex items-center gap-2 mb-8 border-b border-slate-800 pb-4">
             <h2 className="text-[17px] font-bold text-white uppercase tracking-wider">Exposure Score</h2>
             <span className="text-[10px] font-bold text-slate-500 ml-auto bg-slate-800 px-2 py-0.5 rounded">CES-V1</span>
           </div>
           <div className="flex flex-col sm:flex-row items-center justify-around gap-8">
             <div className="relative w-64 h-64 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#1e273a" strokeWidth="3" />
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="289" strokeDashoffset={289 - (calculatedScore/1000 * 289)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                  <circle cx="50" cy="50" r="34" fill="none" stroke="#1e273a" strokeWidth="8" />
                  <circle cx="50" cy="50" r="34" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="213" strokeDashoffset="60" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                  <span className="text-4xl font-extrabold text-white tracking-tighter drop-shadow-lg">{calculatedScore}</span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Score Index</span>
                  <div className="mt-3 px-3 py-0.5 bg-rose-500/20 border border-rose-500/30 text-rose-500 text-[11px] font-black rounded-full">HIGH RISK</div>
                </div>
             </div>
             <div className="flex-1 w-full space-y-4">
                <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wide mb-4">Core Exposure Drivers</h3>
                <div className="grid grid-cols-1 gap-2">
                   <ScoreDriverDark icon={ShieldAlert} title="Vulnerabilities" val={stats.Total} level="Crit" />
                   <ScoreDriverDark icon={Globe} title="Cloud Assets" val={578} level="High" />
                   <ScoreDriverDark icon={User} title="IAM Exposures" val="32" level="Med" />
                </div>
             </div>
           </div>
        </div>

        <div className="bg-[#161c2d] rounded-xl border border-slate-800 p-8 shadow-xl">
           <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
              <h2 className="text-[17px] font-bold text-white uppercase tracking-wider">Attack Path Probabilities</h2>
              <div className="flex gap-1">
                 <button className="px-3 py-1 bg-blue-600 text-[10px] font-bold rounded">Global</button>
                 <button className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-bold rounded">AWS</button>
              </div>
           </div>
           <div className="relative">
              <div className="grid grid-cols-4 gap-1.5">
                 {heatmapData.flat().map((val, idx) => {
                    let bg = 'bg-[#1e273a]', text = 'text-slate-500', shadow = '';
                    if (val > 2000) { bg = 'bg-red-600'; text = 'text-white'; shadow = 'shadow-[0_0_15px_rgba(220,38,38,0.3)]'; }
                    else if (val > 1000) { bg = 'bg-red-500/80'; text = 'text-white'; }
                    else if (val > 500) { bg = 'bg-orange-500/60'; text = 'text-white'; }
                    return (
                      <div key={idx} className={`h-[60px] flex items-center justify-center text-[13px] font-black rounded transition-all hover:scale-105 cursor-crosshair border border-white/5 ${bg} ${text} ${shadow}`}>
                        {val || '-'}
                      </div>
                    );
                 })}
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                 <span>Asset Target Value &rarr;</span>
                 <span className="text-right">Access Control Complexity &rarr;</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="bg-[#161c2d] border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-400 uppercase mb-6 tracking-widest">Inventory Health</h2>
            <div className="flex items-end gap-3">
               <span className="text-4xl font-extrabold text-white">{new Set(vulns.map(v => v.workload)).size * 12 + 5}</span>
               <span className="text-xs text-green-400 font-bold mb-1.5">+12% vs last scan</span>
            </div>
            <div className="mt-8 space-y-3">
               <InventoryLine label="Elastic Compute (EC2)" val="65%" color="bg-blue-500" />
               <InventoryLine label="Serverless (Lambda)" val="25%" color="bg-purple-500" />
               <InventoryLine label="Containers (ECR)" val="10%" color="bg-emerald-500" />
            </div>
         </div>
         <div className="bg-[#161c2d] border border-slate-800 rounded-xl p-6 shadow-xl lg:col-span-2">
            <h2 className="text-sm font-bold text-slate-400 uppercase mb-6 tracking-widest">Severity Distribution Trend</h2>
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={[
                      { name: 'Critical', count: stats.Critical, fill: '#ef4444' },
                      { name: 'High', count: stats.High, fill: '#f97316' },
                      { name: 'Medium', count: stats.Medium, fill: '#f59e0b' },
                      { name: 'Low', count: stats.Low, fill: '#3b82f6' }
                   ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2736"/>
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} stroke="#475569" />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#475569" />
                      <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}/>
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40} />
                   </BarChart>
                </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
}

function ScoreDriverDark({ icon: Icon, title, val, level }) {
   return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-[#1e273a] border border-white/5 hover:border-blue-500/40 transition-all cursor-pointer group">
         <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-slate-800/80 group-hover:text-blue-400"><Icon size={16}/></div>
            <span className="text-[13px] font-bold text-slate-200">{title}</span>
         </div>
         <div className="flex items-center gap-3">
            <span className="text-lg font-black text-white">{val}</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${level === 'Crit' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>{level}</span>
         </div>
      </div>
   );
}

function InventoryLine({ label, val, color }) {
   return (
      <div className="space-y-1.5">
         <div className="flex justify-between text-[11px] font-bold text-slate-500">
            <span>{label}</span>
            <span>{val}</span>
         </div>
         <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full`} style={{ width: val }} />
         </div>
      </div>
   );
}

function IconButton({ icon: Icon, badge }) {
   return (
      <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition-all relative">
         <Icon size={18} />
         {badge && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
      </button>
   );
}

const User = ({ size, className }) => <Activity size={size} className={className}/>;
