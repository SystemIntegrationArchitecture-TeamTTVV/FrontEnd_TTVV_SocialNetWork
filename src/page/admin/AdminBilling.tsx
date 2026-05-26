import { useEffect, useState } from 'react';
import { billingApi, type CoinPackageData, type GiftData, type AdminReportData } from '../../apis/billing';
import toast from 'react-hot-toast';
import { Wallet, BarChart3, Package, Gift, CircleDollarSign, CheckCircle, CreditCard, Trophy, Star, Coffee, CupSoda, Gem, Car, Rocket, Castle, Flower2, Plus } from 'lucide-react';

type Tab = 'report' | 'packages' | 'gifts';

export default function AdminBilling() {
  const [tab, setTab] = useState<Tab>('report');
  const [report, setReport] = useState<AdminReportData | null>(null);
  const [packages, setPackages] = useState<CoinPackageData[]>([]);
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPkg, setEditPkg] = useState<Partial<CoinPackageData> | null>(null);
  const [editGift, setEditGift] = useState<Partial<GiftData> | null>(null);

  useEffect(() => { loadTab(); }, [tab]);

  const loadTab = async () => {
    setLoading(true);
    try {
      if (tab === 'report') setReport(await billingApi.getAdminReport());
      if (tab === 'packages') setPackages(await billingApi.getAllCoinPackages());
      if (tab === 'gifts') setGifts(await billingApi.getAllGiftsAdmin());
    } catch { toast.error('Lỗi tải dữ liệu'); }
    finally { setLoading(false); }
  };

  const fmtVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  const savePkg = async () => {
    if (!editPkg) return;
    try {
      if (editPkg.id) await billingApi.updateCoinPackage(editPkg.id, editPkg);
      else await billingApi.createCoinPackage(editPkg);
      toast.success('Đã lưu gói xu');
      setEditPkg(null);
      loadTab();
    } catch { toast.error('Lỗi lưu gói xu'); }
  };

  const saveGift = async () => {
    if (!editGift) return;
    try {
      if (editGift.id) await billingApi.updateGift(editGift.id, editGift);
      else await billingApi.createGift(editGift);
      toast.success('Đã lưu quà tặng');
      setEditGift(null);
      loadTab();
    } catch { toast.error('Lỗi lưu quà tặng'); }
  };

  const togglePkg = async (id: string, active: boolean) => {
    await billingApi.toggleCoinPackage(id, !active);
    loadTab();
  };

  const toggleGiftItem = async (id: string, active: boolean) => {
    await billingApi.toggleGift(id, !active);
    loadTab();
  };

  const delPkg = async (id: string) => {
    if (!confirm('Xóa gói xu này?')) return;
    await billingApi.deleteCoinPackage(id);
    loadTab();
  };

  const renderGiftIcon = (name: string) => {
    const str = name.toLowerCase();
    const c = "w-10 h-10 drop-shadow-md";
    if (str.includes('hoa')) return <Flower2 className={`${c} text-pink-500`} />;
    if (str.includes('cà phê')) return <Coffee className={`${c} text-amber-700`} />;
    if (str.includes('trà sữa')) return <CupSoda className={`${c} text-orange-500`} />;
    if (str.includes('ngôi sao')) return <Star className={`${c} text-yellow-400`} fill="currentColor" />;
    if (str.includes('kim cương')) return <Gem className={`${c} text-cyan-400`} fill="currentColor" />;
    if (str.includes('xe')) return <Car className={`${c} text-red-500`} fill="currentColor" />;
    if (str.includes('lửa')) return <Rocket className={`${c} text-orange-500`} fill="currentColor" />;
    if (str.includes('lâu đài')) return <Castle className={`${c} text-indigo-500`} />;
    return <Gift className={`${c} text-purple-500`} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-500/10 p-3 rounded-2xl">
          <Wallet className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-3xl font-black text-[#050505] dark:text-[#edf0fa] tracking-tight">Quản lý Nạp Xu & Quà Tặng</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-[#f0f2f5] dark:bg-[#22263a] rounded-2xl max-w-2xl">
        {[
          { k: 'report', l: 'Báo cáo', i: <BarChart3 className="w-4 h-4" /> },
          { k: 'packages', l: 'Gói Xu', i: <Package className="w-4 h-4" /> },
          { k: 'gifts', l: 'Quà Tặng', i: <Gift className="w-4 h-4" /> }
        ].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k as Tab)}
            className={`flex flex-1 items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${tab === t.k ? 'bg-white dark:bg-[#1a1d28] text-indigo-600 dark:text-indigo-400 shadow-md scale-100' : 'text-[#65676b] dark:text-[#7e89a6] hover:bg-black/5 dark:hover:bg-white/5 scale-95 hover:scale-100'}`}>
            {t.i} {t.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-[#1877F2]/30 border-t-[#1877F2] rounded-full animate-spin"/></div>
      ) : (
        <>
          {/* ── Report ── */}
          {tab === 'report' && report && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  {label:'Tổng doanh thu', value: fmtVnd(report.totalRevenue||0), icon:<CircleDollarSign className="w-8 h-8"/>, bg:'bg-gradient-to-br from-emerald-400 to-emerald-600'},
                  {label:'GD thành công', value: String(report.totalSuccessPayments||0), icon:<CheckCircle className="w-8 h-8"/>, bg:'bg-gradient-to-br from-blue-400 to-blue-600'},
                  {label:'Tổng GD thanh toán', value: String(report.totalPayments||0), icon:<CreditCard className="w-8 h-8"/>, bg:'bg-gradient-to-br from-purple-400 to-purple-600'},
                  {label:'GD tặng quà', value: String(report.totalGiftTransactions||0), icon:<Gift className="w-8 h-8"/>, bg:'bg-gradient-to-br from-orange-400 to-orange-600'},
                ].map((c,i)=>(
                  <div key={i} className={`${c.bg} rounded-3xl p-6 text-white shadow-xl shadow-black/5 relative overflow-hidden transform hover:-translate-y-1 transition-transform duration-300`}>
                    <div className="absolute -right-4 -bottom-4 opacity-20 scale-150">
                      {c.icon}
                    </div>
                    <div className="text-white/80 mb-4">{c.icon}</div>
                    <div className="text-3xl font-black mb-1">{c.value}</div>
                    <div className="text-sm font-medium text-white/90">{c.label}</div>
                  </div>
                ))}
              </div>

              {/* Top Depositors */}
              <div className="bg-white dark:bg-[#1a1d28] rounded-3xl border border-[#e4e6eb] dark:border-[#2b2f45] p-6 shadow-xl shadow-black/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-amber-100 dark:bg-amber-500/20 p-2 rounded-xl">
                    <Trophy className="w-5 h-5 text-amber-500" />
                  </div>
                  <h3 className="font-black text-lg text-[#050505] dark:text-[#edf0fa]">Top người nạp xu</h3>
                </div>
                {(report.topDepositors||[]).length === 0 ? <p className="text-sm text-[#65676b]">Chưa có dữ liệu</p> : (
                  <div className="space-y-3">
                    {report.topDepositors.map((d,i)=>(
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#f7f8fa] dark:bg-[#13151f] hover:bg-gray-100 dark:hover:bg-[#22263a] transition-colors border border-transparent dark:border-[#2b2f45]">
                        <div className="flex items-center gap-4">
                          <span className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-sm ${i===0?'bg-amber-100 text-amber-600':i===1?'bg-gray-200 text-gray-600':i===2?'bg-orange-100 text-orange-600':'bg-white dark:bg-[#2b2f45] text-gray-400'}`}>
                            #{i+1}
                          </span>
                          <span className="font-bold text-[#050505] dark:text-[#edf0fa]">{d.userId}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-black text-emerald-500">{fmtVnd(d.totalSpent)}</span>
                          <span className="text-xs text-gray-500 font-medium">{d.count} lần giao dịch</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Streamers */}
              <div className="bg-white dark:bg-[#1a1d28] rounded-3xl border border-[#e4e6eb] dark:border-[#2b2f45] p-6 shadow-xl shadow-black/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-yellow-100 dark:bg-yellow-500/20 p-2 rounded-xl">
                    <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
                  </div>
                  <h3 className="font-black text-lg text-[#050505] dark:text-[#edf0fa]">Top streamer nhận quà</h3>
                </div>
                {(report.topStreamers||[]).length === 0 ? <p className="text-sm text-[#65676b]">Chưa có dữ liệu</p> : (
                  <div className="space-y-3">
                    {report.topStreamers.map((s,i)=>(
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#f7f8fa] dark:bg-[#13151f] hover:bg-gray-100 dark:hover:bg-[#22263a] transition-colors border border-transparent dark:border-[#2b2f45]">
                        <div className="flex items-center gap-4">
                          <span className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-sm ${i===0?'bg-yellow-100 text-yellow-600':i===1?'bg-gray-200 text-gray-600':i===2?'bg-orange-100 text-orange-600':'bg-white dark:bg-[#2b2f45] text-gray-400'}`}>
                            #{i+1}
                          </span>
                          <span className="font-bold text-[#050505] dark:text-[#edf0fa]">{s.receiverName||s.receiverId}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-black text-yellow-500">{s.totalCoins.toLocaleString()} xu</span>
                          <span className="text-xs text-gray-500 font-medium">{s.giftCount} phần quà</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Packages ── */}
          {tab === 'packages' && (
            <div className="space-y-4">
              <button onClick={()=>setEditPkg({coins:100,bonusCoins:0,priceVnd:10000,name:'',description:'',active:true,sortOrder:0})}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
                <Plus className="w-5 h-5" /> Thêm gói xu
              </button>
              <div className="space-y-2">
                {packages.map(p=>(
                  <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl border ${p.active?'border-[#e4e6eb] dark:border-[#2b2f45] bg-white dark:bg-[#1a1d28]':'border-red-300/30 bg-red-50/50 dark:bg-red-900/10'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#050505] dark:text-[#edf0fa]">{p.name}</span>
                        {!p.active && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Ẩn</span>}
                      </div>
                      <p className="text-sm text-[#65676b] dark:text-[#7e89a6]">
                        {p.coins} xu {p.bonusCoins>0 && `+ ${p.bonusCoins} bonus`} — {fmtVnd(p.priceVnd)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>setEditPkg(p)} className="px-3 py-1.5 text-xs bg-[#e7f3ff] text-[#1877F2] rounded-lg font-medium">Sửa</button>
                      <button onClick={()=>togglePkg(p.id,p.active)} className="px-3 py-1.5 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 rounded-lg font-medium">
                        {p.active?'Ẩn':'Hiện'}
                      </button>
                      <button onClick={()=>delPkg(p.id)} className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/20 text-red-500 rounded-lg font-medium">Xóa</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Gifts ── */}
          {tab === 'gifts' && (
            <div className="space-y-4">
              <button onClick={()=>setEditGift({name:'',price:10,emoji:'🎁',category:'popular',active:true,sortOrder:0})}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
                <Plus className="w-5 h-5" /> Thêm quà tặng
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gifts.map(g=>(
                  <div key={g.id} className={`flex items-center gap-4 p-5 rounded-2xl border transition-all hover:shadow-lg ${g.active?'border-[#e4e6eb] dark:border-[#2b2f45] bg-white dark:bg-[#1a1d28] hover:border-indigo-200 dark:hover:border-indigo-500/30':'border-red-300/30 bg-red-50/50 dark:bg-red-900/10'}`}>
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                      {renderGiftIcon(g.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#050505] dark:text-[#edf0fa]">{g.name}</p>
                      <p className="text-sm text-yellow-500 font-medium">{g.price} xu · {g.category}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={()=>setEditGift(g)} className="px-2 py-1 text-[10px] bg-[#e7f3ff] text-[#1877F2] rounded font-medium">Sửa</button>
                      <button onClick={()=>toggleGiftItem(g.id,g.active!)} className="px-2 py-1 text-[10px] bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 rounded font-medium">
                        {g.active?'Ẩn':'Hiện'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Edit Package Modal ── */}
      {editPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1a1d28] rounded-2xl w-full max-w-md p-6 border border-[#e4e6eb] dark:border-[#2b2f45] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#050505] dark:text-[#edf0fa]">{editPkg.id?'Sửa':'Thêm'} gói xu</h3>
            {[
              {k:'name',l:'Tên gói',t:'text'},
              {k:'coins',l:'Số xu',t:'number'},
              {k:'bonusCoins',l:'Xu bonus',t:'number'},
              {k:'priceVnd',l:'Giá (VND)',t:'number'},
              {k:'description',l:'Mô tả',t:'text'},
              {k:'sortOrder',l:'Thứ tự',t:'number'},
            ].map(f=>(
              <div key={f.k}>
                <label className="text-xs font-medium text-[#65676b] dark:text-[#7e89a6]">{f.l}</label>
                <input type={f.t}
                  value={(editPkg as any)[f.k]||''}
                  onChange={e=>setEditPkg({...editPkg,[f.k]:f.t==='number'?Number(e.target.value):e.target.value})}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] bg-[#f7f8fa] dark:bg-[#13151f] text-[#050505] dark:text-[#edf0fa] text-sm"
                />
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editPkg.active??true} onChange={e=>setEditPkg({...editPkg,active:e.target.checked})} />
              <span className="text-[#050505] dark:text-[#edf0fa]">Hiển thị</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={savePkg} className="flex-1 py-2.5 bg-[#1877F2] text-white rounded-xl font-bold">Lưu</button>
              <button onClick={()=>setEditPkg(null)} className="flex-1 py-2.5 bg-[#f0f2f5] dark:bg-[#22263a] text-[#050505] dark:text-[#edf0fa] rounded-xl font-bold">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Gift Modal ── */}
      {editGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1a1d28] rounded-2xl w-full max-w-md p-6 border border-[#e4e6eb] dark:border-[#2b2f45] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#050505] dark:text-[#edf0fa]">{editGift.id?'Sửa':'Thêm'} quà tặng</h3>
            {[
              {k:'name',l:'Tên quà',t:'text'},
              {k:'emoji',l:'Emoji/Icon',t:'text'},
              {k:'price',l:'Giá xu',t:'number'},
              {k:'category',l:'Danh mục',t:'text'},
              {k:'imageUrl',l:'URL hình ảnh',t:'text'},
              {k:'sortOrder',l:'Thứ tự',t:'number'},
            ].map(f=>(
              <div key={f.k}>
                <label className="text-xs font-medium text-[#65676b] dark:text-[#7e89a6]">{f.l}</label>
                <input type={f.t}
                  value={(editGift as any)[f.k]||''}
                  onChange={e=>setEditGift({...editGift,[f.k]:f.t==='number'?Number(e.target.value):e.target.value})}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-[#e4e6eb] dark:border-[#2b2f45] bg-[#f7f8fa] dark:bg-[#13151f] text-[#050505] dark:text-[#edf0fa] text-sm"
                />
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editGift.active??true} onChange={e=>setEditGift({...editGift,active:e.target.checked})} />
              <span className="text-[#050505] dark:text-[#edf0fa]">Hiển thị</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={saveGift} className="flex-1 py-2.5 bg-[#1877F2] text-white rounded-xl font-bold">Lưu</button>
              <button onClick={()=>setEditGift(null)} className="flex-1 py-2.5 bg-[#f0f2f5] dark:bg-[#22263a] text-[#050505] dark:text-[#edf0fa] rounded-xl font-bold">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
