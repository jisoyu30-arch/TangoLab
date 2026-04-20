// 재사용 에디토리얼 UI 컴포넌트 — 탱고 빈티지 매거진 스타일
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

/**
 * 섹션 헤더 (eyebrow + 대형 이탤릭 제목 + 장식 구분선)
 * The Pudding + Kinfolk 스타일
 */
export function EditorialHeader({ eyebrow, title, subtitle, align = 'center' }: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
}) {
  const textAlign = align === 'center' ? 'text-center' : 'text-left';
  return (
    <div className={`border-b border-tango-brass/20 pb-6 md:pb-8 ${textAlign}`}>
      {eyebrow && (
        <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
          {eyebrow}
        </div>
      )}
      <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-tango-paper italic leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-sm text-tango-cream/60 mt-3 font-serif italic ${align === 'center' ? 'max-w-xl mx-auto' : ''}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/**
 * 아르데코 구분선 (◈)
 */
export function OrnamentDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <div className="h-px w-12 bg-tango-brass/40"></div>
      <span className="text-tango-brass text-sm">◈</span>
      <div className="h-px w-12 bg-tango-brass/40"></div>
    </div>
  );
}

/**
 * 매거진 스타일 통계 카드 (대형 숫자 + 작은 라벨)
 */
export function EditorialStat({ value, label, small }: {
  value: number | string;
  label: string;
  small?: boolean;
}) {
  return (
    <div className="border-l-2 border-tango-brass/40 pl-3 md:pl-4 py-1">
      <div className={`font-display font-bold text-tango-brass leading-none ${small ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl lg:text-5xl'}`} style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-[10px] tracking-[0.2em] uppercase text-tango-cream/60 mt-2 font-sans">
        {label}
      </div>
    </div>
  );
}

/**
 * 에디토리얼 카드 (매거진 프레임)
 */
export function EditorialCard({ children, className = '', as: As = 'div', ...props }: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section';
  [key: string]: any;
}) {
  return (
    <As className={`bg-tango-shadow/60 border border-tango-brass/15 rounded-sm p-5 md:p-6 ${className}`} {...props}>
      {children}
    </As>
  );
}

/**
 * 매거진 목차 스타일 리스트 아이템 (큰 번호 + 세리프 제목)
 */
export function EditorialListItem({ to, number, title, subtitle, right, icon }: {
  to?: string;
  number?: string | number;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  icon?: ReactNode;
}) {
  const content = (
    <div className="group flex items-start gap-4 md:gap-5 py-4 border-b border-tango-brass/15 hover:bg-tango-brass/5 px-2 -mx-2 transition-colors">
      {icon ? (
        <div className="flex-shrink-0 mt-1">{icon}</div>
      ) : number !== undefined ? (
        <span className="font-display text-3xl md:text-4xl text-tango-brass/60 leading-none w-10 md:w-12 flex-shrink-0" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          {typeof number === 'number' ? String(number).padStart(2, '0') : number}
        </span>
      ) : null}
      <div className="flex-1 min-w-0">
        <h3 className="font-serif text-lg md:text-xl text-tango-paper group-hover:text-tango-brass transition-colors truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] tracking-wider uppercase text-tango-cream/50 font-sans mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="flex-shrink-0 flex items-center gap-2">{right}</div>}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

/**
 * 탭 (버건디 언더라인)
 */
export function EditorialTabs({ tabs, active, onChange }: {
  tabs: Array<{ value: string; label: string; count?: number }>;
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-0 border-b border-tango-brass/20 overflow-x-auto">
      {tabs.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-4 md:px-6 py-3 text-sm font-serif italic whitespace-nowrap transition-all border-b-2 ${
            active === t.value
              ? 'text-tango-paper border-tango-brass'
              : 'text-tango-cream/50 border-transparent hover:text-tango-paper/80'
          }`}
          style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
        >
          {t.label}
          {t.count !== undefined && (
            <span className="ml-2 text-[10px] font-sans not-italic text-tango-brass/70">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * 에디토리얼 버튼
 */
export function EditorialButton({ to, onClick, variant = 'primary', children, className = '' }: {
  to?: string;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'outline';
  children: ReactNode;
  className?: string;
}) {
  const base = 'inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-serif italic tracking-wide transition-all min-h-[44px]';
  const styles = {
    primary: 'bg-tango-brass text-tango-ink hover:bg-tango-brass/90 shadow-lg',
    ghost: 'text-tango-brass hover:bg-tango-brass/10',
    outline: 'border border-tango-brass/40 text-tango-paper hover:border-tango-brass hover:bg-tango-brass/5',
  };
  const cls = `${base} ${styles[variant]} ${className}`;
  const fontStyle = { fontFamily: '"Cormorant Garamond", Georgia, serif' };
  if (to) return <Link to={to} className={cls} style={fontStyle}>{children}</Link>;
  return <button onClick={onClick} className={cls} style={fontStyle}>{children}</button>;
}

/**
 * 태그/뱃지 (미니멀)
 */
export function EditorialTag({ children, variant = 'brass', small }: {
  children: ReactNode;
  variant?: 'brass' | 'rose' | 'burgundy' | 'muted';
  small?: boolean;
}) {
  const variants = {
    brass: 'border-tango-brass/40 text-tango-brass bg-tango-brass/5',
    rose: 'border-tango-rose/40 text-tango-rose bg-tango-rose/5',
    burgundy: 'border-tango-burgundy/50 text-tango-rose bg-tango-burgundy/10',
    muted: 'border-tango-cream/20 text-tango-cream/60 bg-tango-cream/5',
  };
  return (
    <span className={`inline-flex items-center border rounded-sm font-sans tracking-wider uppercase ${small ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'} ${variants[variant]}`}>
      {children}
    </span>
  );
}

/**
 * 입력 (언더라인 스타일)
 */
export function EditorialInput({ value, onChange, placeholder, type = 'text', className = '' }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-transparent border-0 border-b-2 border-tango-brass/30 focus:border-tango-brass pb-2 pt-1 font-serif text-base md:text-lg text-tango-paper placeholder-tango-cream/30 focus:outline-none transition-colors ${className}`}
      style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
    />
  );
}

/**
 * 빈 상태
 */
export function EditorialEmptyState({ icon, title, subtitle, action }: {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-16 border border-dashed border-tango-brass/20 rounded-sm">
      {icon && <div className="text-4xl mb-4 opacity-40">{icon}</div>}
      <OrnamentDivider className="mb-4" />
      <h3 className="font-display text-2xl italic text-tango-paper mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
        {title}
      </h3>
      {subtitle && <p className="text-sm text-tango-cream/50 font-serif italic mb-4">{subtitle}</p>}
      {action}
    </div>
  );
}
