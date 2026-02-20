import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Kurse, Anmeldungen } from '@/types/app';
import {
  BookOpen, Users, GraduationCap, DoorOpen, ClipboardList,
  Euro, CheckCircle, Clock, ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface Stats {
  dozenten: number;
  raeume: number;
  teilnehmer: number;
  kurse: number;
  anmeldungen: number;
  bezahlt: number;
  unbezahlt: number;
  aktiveKurse: number;
  geplantKurse: number;
  abgeschlossen: number;
  abgesagt: number;
  umsatz: number;
  kurseList: Kurse[];
  anmeldungenList: Anmeldungen[];
}

function KpiHero({ value, label, sub }: { value: string | number; label: string; sub?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-5xl font-800 tracking-tight" style={{ fontWeight: 800 }}>{value}</span>
      <span className="text-sm font-semibold mt-1 opacity-90">{label}</span>
      {sub && <span className="text-xs opacity-60 mt-0.5">{sub}</span>}
    </div>
  );
}

function MiniCard({
  icon: Icon, label, value, color
}: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-card flex items-center gap-4 transition-smooth hover:shadow-hero cursor-default">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '1a' }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    geplant: 'status-geplant',
    aktiv: 'status-aktiv',
    abgeschlossen: 'status-abgeschlossen',
    abgesagt: 'status-abgesagt',
  };
  const labels: Record<string, string> = {
    geplant: 'Geplant',
    aktiv: 'Aktiv',
    abgeschlossen: 'Abgeschlossen',
    abgesagt: 'Abgesagt',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? ''}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [doz, rae, teil, kurs, anm] = await Promise.all([
          LivingAppsService.getDozenten(),
          LivingAppsService.getRaeume(),
          LivingAppsService.getTeilnehmer(),
          LivingAppsService.getKurse(),
          LivingAppsService.getAnmeldungen(),
        ]);
        const bezahlt = anm.filter(a => a.fields.bezahlt === true).length;
        const unbezahlt = anm.filter(a => a.fields.bezahlt !== true).length;
        const aktiveKurse = kurs.filter(k => k.fields.status === 'aktiv').length;
        const geplantKurse = kurs.filter(k => k.fields.status === 'geplant').length;
        const abgeschlossen = kurs.filter(k => k.fields.status === 'abgeschlossen').length;
        const abgesagt = kurs.filter(k => k.fields.status === 'abgesagt').length;
        const umsatz = kurs.reduce((sum, k) => {
          const anmCount = anm.filter(a => a.fields.kurs?.includes(k.record_id)).length;
          return sum + (k.fields.preis ?? 0) * anmCount;
        }, 0);
        setStats({
          dozenten: doz.length,
          raeume: rae.length,
          teilnehmer: teil.length,
          kurse: kurs.length,
          anmeldungen: anm.length,
          bezahlt,
          unbezahlt,
          aktiveKurse,
          geplantKurse,
          abgeschlossen,
          abgesagt,
          umsatz,
          kurseList: kurs.slice(0, 5),
          anmeldungenList: anm.slice(0, 5),
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statusChartData = stats
    ? [
        { name: 'Geplant', value: stats.geplantKurse, color: 'oklch(0.55 0.18 258)' },
        { name: 'Aktiv', value: stats.aktiveKurse, color: 'oklch(0.52 0.15 162)' },
        { name: 'Abgeschl.', value: stats.abgeschlossen, color: 'oklch(0.52 0.02 260)' },
        { name: 'Abgesagt', value: stats.abgesagt, color: 'oklch(0.58 0.18 25)' },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* === HERO BANNER === */}
      <div className="rounded-3xl gradient-hero shadow-hero p-8 lg:p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)',
        }} />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-16">
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase">
              <BookOpen size={12} />
              Kursverwaltung
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Willkommen im<br />KursManager
            </h1>
            <p className="text-white/70 text-base max-w-md">
              Verwalten Sie Kurse, Dozenten, Teilnehmer und Räume an einem zentralen Ort.
            </p>
          </div>
          <div className="flex gap-10 lg:gap-16 shrink-0">
            <KpiHero value={stats?.kurse ?? 0} label="Kurse gesamt" sub={`${stats?.aktiveKurse ?? 0} aktiv`} />
            <div className="w-px bg-white/20" />
            <KpiHero value={stats?.anmeldungen ?? 0} label="Anmeldungen" sub={`${stats?.bezahlt ?? 0} bezahlt`} />
            <div className="w-px bg-white/20 hidden lg:block" />
            <KpiHero
              value={stats ? `${stats.umsatz.toLocaleString('de-DE')} €` : '0 €'}
              label="Gesamtumsatz"
              sub="kalkuliert"
            />
          </div>
        </div>
      </div>

      {/* === KPI GRID === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniCard icon={GraduationCap} label="Dozenten" value={stats?.dozenten ?? 0} color="oklch(0.55 0.18 258)" />
        <MiniCard icon={DoorOpen} label="Räume" value={stats?.raeume ?? 0} color="oklch(0.72 0.14 68)" />
        <MiniCard icon={Users} label="Teilnehmer" value={stats?.teilnehmer ?? 0} color="oklch(0.60 0.15 162)" />
        <MiniCard icon={ClipboardList} label="Anmeldungen" value={stats?.anmeldungen ?? 0} color="oklch(0.65 0.18 310)" />
      </div>

      {/* === CHARTS + TABLES === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status chart */}
        <div className="bg-card rounded-2xl shadow-card p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold">Kurse nach Status</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Verteilung aller Kurse</p>
          </div>
          {(stats?.kurse ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
              <BookOpen size={32} className="mb-2 opacity-30" />
              Noch keine Kurse
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={statusChartData} barSize={28} margin={{ left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12, fontFamily: 'Plus Jakarta Sans' }}
                  cursor={{ fill: 'oklch(0.95 0.004 260)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Geplant</span>
              <span className="font-bold ml-auto">{stats?.geplantKurse ?? 0}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Aktiv</span>
              <span className="font-bold ml-auto">{stats?.aktiveKurse ?? 0}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-muted-foreground">Abgeschl.</span>
              <span className="font-bold ml-auto">{stats?.abgeschlossen ?? 0}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-muted-foreground">Abgesagt</span>
              <span className="font-bold ml-auto">{stats?.abgesagt ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Zahlungsstatus */}
        <div className="bg-card rounded-2xl shadow-card p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold">Zahlungsstatus</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Bezahlte vs. offene Anmeldungen</p>
          </div>
          {(stats?.anmeldungen ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
              <Euro size={32} className="mb-2 opacity-30" />
              Noch keine Anmeldungen
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Big number */}
              <div className="flex items-end gap-2">
                <span className="text-5xl font-extrabold tracking-tight">{stats?.bezahlt ?? 0}</span>
                <span className="text-muted-foreground text-sm pb-2">von {stats?.anmeldungen ?? 0}</span>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">Anmeldungen bezahlt</p>

              {/* Progress bar */}
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${stats && stats.anmeldungen > 0 ? (stats.bezahlt / stats.anmeldungen) * 100 : 0}%`,
                    background: 'var(--gradient-amber)',
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stats && stats.anmeldungen > 0 ? Math.round((stats.bezahlt / stats.anmeldungen) * 100) : 0}% bezahlt</span>
                <span>{stats?.unbezahlt ?? 0} offen</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5 bg-muted/50 rounded-xl p-3">
                  <CheckCircle size={18} className="shrink-0" style={{ color: 'oklch(0.52 0.15 162)' }} />
                  <div>
                    <p className="text-xs text-muted-foreground">Bezahlt</p>
                    <p className="font-bold text-sm">{stats?.bezahlt ?? 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-muted/50 rounded-xl p-3">
                  <Clock size={18} className="shrink-0" style={{ color: 'oklch(0.72 0.14 68)' }} />
                  <div>
                    <p className="text-xs text-muted-foreground">Offen</p>
                    <p className="font-bold text-sm">{stats?.unbezahlt ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Schnellzugriff */}
        <div className="bg-card rounded-2xl shadow-card p-6 space-y-3">
          <div>
            <h2 className="text-base font-bold">Schnellzugriff</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Direkt zu Verwaltungsbereichen</p>
          </div>
          <div className="space-y-2 pt-1">
            {[
              { label: 'Dozenten verwalten', sub: `${stats?.dozenten ?? 0} eingetragen`, icon: GraduationCap, href: '/dozenten', color: 'oklch(0.55 0.18 258)' },
              { label: 'Räume verwalten', sub: `${stats?.raeume ?? 0} eingetragen`, icon: DoorOpen, href: '/raeume', color: 'oklch(0.72 0.14 68)' },
              { label: 'Teilnehmer verwalten', sub: `${stats?.teilnehmer ?? 0} eingetragen`, icon: Users, href: '/teilnehmer', color: 'oklch(0.60 0.15 162)' },
              { label: 'Kurse verwalten', sub: `${stats?.kurse ?? 0} eingetragen`, icon: BookOpen, href: '/kurse', color: 'oklch(0.65 0.18 310)' },
              { label: 'Anmeldungen verwalten', sub: `${stats?.anmeldungen ?? 0} eingetragen`, icon: ClipboardList, href: '/anmeldungen', color: 'oklch(0.60 0.15 25)' },
            ].map(item => (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-smooth hover:bg-muted/60 text-left group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.color + '1a' }}>
                  <item.icon size={15} style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
                <ArrowRight size={14} className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-smooth" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* === RECENT COURSES === */}
      {(stats?.kurseList.length ?? 0) > 0 && (
        <div className="bg-card rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold">Aktuelle Kurse</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Zuletzt hinzugefügte Kurse</p>
            </div>
            <button
              onClick={() => navigate('/kurse')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Alle anzeigen <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {stats?.kurseList.map(kurs => (
              <div
                key={kurs.record_id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted/40 transition-smooth cursor-default"
              >
                <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shrink-0">
                  <BookOpen size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{kurs.fields.titel ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {kurs.fields.startdatum
                      ? format(parseISO(kurs.fields.startdatum), 'dd. MMM yyyy', { locale: de })
                      : 'Kein Datum'}
                    {kurs.fields.preis != null && ` · ${kurs.fields.preis.toLocaleString('de-DE')} €`}
                  </p>
                </div>
                <div className="shrink-0">
                  {kurs.fields.status && <StatusBadge status={kurs.fields.status} />}
                </div>
                {kurs.fields.max_teilnehmer != null && (
                  <div className="text-xs text-muted-foreground shrink-0 hidden lg:block">
                    max. {kurs.fields.max_teilnehmer} TN
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
