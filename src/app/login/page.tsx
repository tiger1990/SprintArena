'use client'

import Link from 'next/link'
import { ArrowRight, ShieldCheck, BarChart2, Sparkles, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTheme }      from '@/hooks/useTheme'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useLoginPage }  from './hooks/useLoginPage'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Feature { icon: LucideIcon; title: string; desc: string }

// ─── Static data (no need to be inside component) ────────────────────────────

const FEATURES: Feature[] = [
  { icon: BarChart2, title: 'Real-time Leaderboards', desc: 'Track velocity and momentum in a competitive arena.' },
  { icon: Sparkles,  title: 'AI Sprint Stories',      desc: 'Automated technical narratives generated per iteration.' },
  { icon: Users,     title: 'Team Scoring',           desc: 'Gamified point systems based on delivery and quality.' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const t  = useTheme()
  const bp = useBreakpoint()
  const lp = useLoginPage()

  const C  = t.colors
  const TY = t.typography
  const SP = t.spacing
  const R  = t.radius
  const SH = t.shadows

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: C.page,
        color: C.text.primary,
        fontFamily: TY.fontFamily.body,
      }}
    >
      {/* ═══════════════════════════ MAIN ═══════════════════════════════════ */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: bp.isDesktop ? 'row' : 'column' }}>

        {/* ── LEFT: Brand / Hero ────────────────────────────────────────── */}
        <HeroPanel C={C} TY={TY} SP={SP} SH={SH} isDesktop={bp.isDesktop} />

        {/* ── RIGHT: Login form ─────────────────────────────────────────── */}
        <LoginPanel C={C} TY={TY} SP={SP} R={R} SH={SH} lp={lp} isDesktop={bp.isDesktop} />

      </main>

      {/* ═══════════════════════════ FOOTER ════════════════════════════════ */}
      <PageFooter C={C} TY={TY} SP={SP} />
    </div>
  )
}

// ─── HeroPanel ────────────────────────────────────────────────────────────────

function HeroPanel({
  C, TY, SP, SH, isDesktop,
}: {
  C: any; TY: any; SP: any; SH: any; isDesktop: boolean
}) {
  return (
    <section
      style={{
        position: 'relative',
        width: isDesktop ? '45%' : '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isDesktop ? `${SP[20]} ${SP[20]}` : `${SP[10]} ${SP[8]}`,
        overflow: 'hidden',
        backgroundColor: C.panel.left,
      }}
    >
      {/* Grid background */}
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />

      {/* Top-left gradient wash */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to bottom right, ${C.gradientOrb}, transparent, transparent)`,
        }}
      />

      {/* Ambient blur orb — bottom left */}
      <div
        style={{
          position: 'absolute',
          bottom: '-6rem',
          left: '-6rem',
          width: '24rem',
          height: '24rem',
          borderRadius: '9999px',
          backgroundColor: C.gradientOrb,
          filter: 'blur(120px)',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '36rem', width: '100%' }}>

        {/* Eyebrow chip */}
        <span
          style={{
            display: 'block',
            fontFamily: TY.fontFamily.body,
            fontSize: TY.fontSize['2xs'],
            fontWeight: TY.fontWeight.bold,
            letterSpacing: TY.letterSpacing.widest,
            textTransform: 'uppercase',
            color: C.accent.DEFAULT,
            marginBottom: SP[4],
          }}
        >
          PREMIUM PERFORMANCE
        </span>

        {/* Headline */}
        <h1
          className="headline-font"
          style={{
            fontSize: isDesktop ? TY.fontSize['7xl'] : TY.fontSize['5xl'],
            fontWeight: TY.fontWeight.bold,
            letterSpacing: TY.letterSpacing.tighter,
            lineHeight: TY.lineHeight.none,
            color: C.text.primary,
            marginBottom: SP[6],
          }}
        >
          Where sprints<br />become<br />
          {/* Gradient "victories." */}
          <span
            style={{
              backgroundImage: `linear-gradient(to right, ${C.accent.DEFAULT}, ${C.accent.dim})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            victories.
          </span>
        </h1>

        {/* Sub-headline */}
        <p
          style={{
            fontSize: isDesktop ? TY.fontSize.xl : TY.fontSize.base,
            fontWeight: TY.fontWeight.light,
            letterSpacing: TY.letterSpacing.tight,
            color: C.text.secondary,
            marginBottom: SP[10],
          }}
        >
          Plan. Compete. Ship. The ultimate velodrome for high-velocity teams.
        </p>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: SP[6] }}>
          {FEATURES.map(f => (
            <FeatureRow key={f.title} feature={f} C={C} TY={TY} SP={SP} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FeatureRow ───────────────────────────────────────────────────────────────

function FeatureRow({ feature, C, TY, SP }: { feature: Feature; C: any; TY: any; SP: any }) {
  const Icon = feature.icon
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: SP[4] }}>
      <div
        style={{
          marginTop: '2px',
          width: SP[6],
          height: SP[6],
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          backgroundColor: C.accent.bgSubtle,
          color: C.accent.DEFAULT,
        }}
      >
        <Icon size={14} strokeWidth={2} />
      </div>
      <div>
        <p style={{ fontWeight: TY.fontWeight.bold, color: C.text.primary, fontSize: TY.fontSize.sm }}>
          {feature.title}
        </p>
        <p style={{ fontSize: TY.fontSize.sm, color: C.text.secondary, marginTop: '2px' }}>
          {feature.desc}
        </p>
      </div>
    </div>
  )
}

// ─── LoginPanel ───────────────────────────────────────────────────────────────

function LoginPanel({
  C, TY, SP, R, SH, lp, isDesktop,
}: {
  C: any; TY: any; SP: any; R: any; SH: any; lp: ReturnType<typeof useLoginPage>; isDesktop: boolean
}) {
  return (
    <section
      style={{
        position: 'relative',
        width: isDesktop ? '55%' : '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isDesktop ? `${SP[12]} ${SP[12]}` : `${SP[10]} ${SP[8]}`,
        backgroundColor: C.panel.right,
      }}
    >
      <div style={{ width: '100%', maxWidth: '28rem' }}>

        {/* Heading */}
        <div style={{ marginBottom: SP[12], textAlign: isDesktop ? 'left' : 'center' }}>
          <h2
            className="headline-font"
            style={{
              fontSize: TY.fontSize['3xl'],
              fontWeight: TY.fontWeight.bold,
              letterSpacing: TY.letterSpacing.tight,
              color: C.text.primary,
              marginBottom: SP[2],
            }}
          >
            Welcome back
          </h2>
          <p style={{ fontSize: TY.fontSize.sm, color: C.text.secondary }}>
            Resume your session in the Arena.
          </p>
        </div>

        {/* Profile card(s) or empty CTA */}
        {!lp.hasUsers ? (
          <EmptyWorkspace C={C} TY={TY} SP={SP} R={R} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SP[3], marginBottom: SP[10] }}>
            {lp.users.map(user => (
              <ProfileCard
                key={user.id}
                name={user.name}
                role={user.role}
                onClick={() => lp.handleSelectUser(user.id)}
                C={C}
                TY={TY}
                SP={SP}
                R={R}
              />
            ))}
          </div>
        )}

        {/* Invite credentials */}
        <InviteSection C={C} TY={TY} SP={SP} R={R} SH={SH} lp={lp} />

        {/* Secondary: SSO */}
        <div
          style={{
            marginTop: SP[12],
            paddingTop: SP[8],
            borderTop: `1px solid ${C.border.subtle}`,
          }}
        >
          <SSOButton C={C} TY={TY} SP={SP} R={R} />
        </div>
      </div>

      {/* Corner branding — desktop only */}
      {isDesktop && <CornerBranding C={C} TY={TY} />}
    </section>
  )
}

// ─── EmptyWorkspace ───────────────────────────────────────────────────────────

function EmptyWorkspace({ C, TY, SP, R }: { C: any; TY: any; SP: any; R: any }) {
  return (
    <div
      style={{
        borderRadius: R.xl,
        padding: SP[8],
        marginBottom: SP[10],
        textAlign: 'center',
        border: `1px dashed ${C.border.DEFAULT}`,
      }}
    >
      <p style={{ fontSize: TY.fontSize.sm, color: C.text.secondary, marginBottom: SP[5] }}>
        No workspace found.
      </p>
      <Link href="/signup">
        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: SP[2],
            padding: `${SP[2.5]} ${SP[5]}`,
            borderRadius: R.lg,
            fontSize: TY.fontSize.sm,
            fontWeight: TY.fontWeight.bold,
            backgroundColor: C.accent.DEFAULT,
            color: C.accent.on,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Create workspace <ArrowRight size={14} />
        </button>
      </Link>
    </div>
  )
}

// ─── ProfileCard ──────────────────────────────────────────────────────────────

import { useState } from 'react'

function ProfileCard({
  name, role, onClick, C, TY, SP, R,
}: {
  name: string; role: string; onClick: () => void
  C: any; TY: any; SP: any; R: any
}) {
  const [hovered, setHovered] = useState(false)
  const inits = initials(name)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SP[6],
        borderRadius: R.xl,
        border: `1px solid ${C.border.subtle}`,
        backgroundColor: hovered ? C.card.hover : C.card.DEFAULT,
        cursor: 'pointer',
        transition: 'background-color 300ms ease',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: SP[5] }}>
        {/* Gradient avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: SP[16],
              height: SP[16],
              borderRadius: '9999px',
              background: `linear-gradient(to top right, ${C.avatar.gradientFrom}, ${C.avatar.gradientTo})`,
              color: C.avatar.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: TY.fontFamily.body,
              fontWeight: TY.fontWeight.bold,
              fontSize: TY.fontSize.xl,
              boxShadow: `0 0 0 2px ${C.avatar.ring}`,
            }}
          >
            {inits}
          </div>
          {/* Online dot */}
          <div
            style={{
              position: 'absolute',
              bottom: '-3px',
              right: '-3px',
              width: SP[5],
              height: SP[5],
              borderRadius: '9999px',
              backgroundColor: C.avatar.dot,
              border: `4px solid ${hovered ? C.card.hover : C.card.DEFAULT}`,
              transition: 'border-color 300ms ease',
            }}
          />
        </div>

        {/* Name + role */}
        <div>
          <p
            style={{
              fontWeight: TY.fontWeight.bold,
              fontSize: TY.fontSize.lg,
              color: C.text.primary,
              lineHeight: TY.lineHeight.tight,
            }}
          >
            {name}
          </p>
          <p
            style={{
              marginTop: SP[1],
              fontSize: TY.fontSize['2xs'],
              fontWeight: TY.fontWeight.bold,
              letterSpacing: TY.letterSpacing.widest,
              textTransform: 'uppercase',
              color: C.accent.DEFAULT,
            }}
          >
            {role}
          </p>
        </div>
      </div>

      {/* Shield icon */}
      <ShieldCheck
        size={20}
        style={{
          color: hovered ? C.accent.DEFAULT : C.text.secondary,
          transition: 'color 200ms ease',
          flexShrink: 0,
        }}
      />
    </button>
  )
}

// ─── InviteSection ────────────────────────────────────────────────────────────

function InviteSection({
  C, TY, SP, R, SH, lp,
}: {
  C: any; TY: any; SP: any; R: any; SH: any; lp: ReturnType<typeof useLoginPage>
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SP[4] }}>
      {/* Label */}
      <label
        style={{
          display: 'block',
          fontSize: TY.fontSize['2xs'],
          fontWeight: TY.fontWeight.bold,
          letterSpacing: TY.letterSpacing.widest,
          textTransform: 'uppercase',
          color: C.text.secondary,
          marginLeft: SP[1],
        }}
      >
        Invite Credentials
      </label>

      {/* Input + button row */}
      <div style={{ position: 'relative' }}>
        <input
          value={lp.inviteCode}
          placeholder="ENTER INVITE CODE"
          maxLength={6}
          onChange={e => lp.handleInviteChange(e.target.value)}
          onFocus={() => lp.setInputFocused(true)}
          onBlur={() => lp.setInputFocused(false)}
          style={{
            width: '100%',
            backgroundColor: C.input.bg,
            color: C.input.text,
            border: 'none',
            outline: 'none',
            borderRadius: R.lg,
            padding: `${SP[5]} ${SP[6]}`,
            paddingRight: SP[20],
            fontFamily: TY.fontFamily.mono,
            fontSize: TY.fontSize.lg,
            letterSpacing: TY.letterSpacing.widest,
            boxShadow: lp.inputFocused ? SH.inputFocus : 'none',
            transition: 'box-shadow 200ms ease',
            caretColor: C.accent.DEFAULT,
          }}
        />
        <ArrowBtn
          disabled={!lp.canSubmitCode}
          onClick={lp.handleInviteSubmit}
          C={C}
          TY={TY}
          SP={SP}
          R={R}
          SH={SH}
        />
      </div>

      {/* Disclaimer */}
      <p
        style={{
          fontSize: TY.fontSize.xs,
          color: C.text.secondary,
          textAlign: 'center',
          marginTop: SP[6],
        }}
      >
        Authorized access only. By entering, you agree to the{' '}
        <Link
          href="/login"
          style={{ color: C.accent.DEFAULT, textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
        >
          Arena Protocol
        </Link>.
      </p>
    </div>
  )
}

// ─── ArrowBtn ─────────────────────────────────────────────────────────────────

function ArrowBtn({
  disabled, onClick, C, TY, SP, R, SH,
}: {
  disabled: boolean; onClick: () => void
  C: any; TY: any; SP: any; R: any; SH: any
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        right: SP[3],
        top: '50%',
        transform: 'translateY(-50%)',
        width: SP[12],
        height: SP[12],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: R.DEFAULT,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: disabled
          ? C.card.hover
          : hovered
          ? C.accent.fixedDim
          : C.accent.DEFAULT,
        color: disabled ? C.text.disabled : C.accent.on,
        boxShadow: !disabled && hovered ? SH.primaryGlow : 'none',
        transition: 'background-color 200ms ease, box-shadow 200ms ease',
      }}
    >
      <ArrowRight size={18} strokeWidth={2.5} />
    </button>
  )
}

// ─── SSOButton ────────────────────────────────────────────────────────────────

function SSOButton({ C, TY, SP, R }: { C: any; TY: any; SP: any; R: any }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SP[3],
        padding: `${SP[3]} ${SP[4]}`,
        borderRadius: R.lg,
        border: `1px solid ${C.border.DEFAULT}`,
        backgroundColor: hovered ? C.card.DEFAULT : 'transparent',
        color: C.text.secondary,
        fontSize: TY.fontSize.sm,
        fontWeight: TY.fontWeight.medium,
        cursor: 'pointer',
        transition: 'background-color 200ms ease',
      }}
    >
      {/* Google-style SSO icon */}
      <svg width="20" height="20" viewBox="0 0 24 24" style={{ opacity: 0.7 }}>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Sign in with Corporate SSO
    </button>
  )
}

// ─── CornerBranding ───────────────────────────────────────────────────────────

function CornerBranding({ C, TY }: { C: any; TY: any }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        bottom: '2.5rem',
        right: '2.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        opacity: hovered ? 1 : 0.3,
        transition: 'opacity 500ms ease',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      <span
        className="headline-font"
        style={{
          fontWeight: TY.fontWeight.black,
          fontSize: TY.fontSize.xl,
          letterSpacing: TY.letterSpacing.tighter,
          color: C.text.primary,
        }}
      >
        SprintArena
      </span>
      <div
        style={{
          width: '4px',
          height: '4px',
          borderRadius: '9999px',
          backgroundColor: C.accent.DEFAULT,
        }}
      />
      <span
        style={{
          fontSize: TY.fontSize['2xs'],
          fontWeight: TY.fontWeight.bold,
          letterSpacing: TY.letterSpacing.widest,
          textTransform: 'uppercase',
          color: C.text.primary,
        }}
      >
        v2.4.6
      </span>
    </div>
  )
}

// ─── PageFooter ───────────────────────────────────────────────────────────────

function PageFooter({ C, TY, SP }: { C: any; TY: any; SP: any }) {
  return (
    <footer
      style={{
        padding: `${SP[6]} ${SP[12]}`,
        backgroundColor: C.pageDim,
        borderTop: `1px solid ${C.border.subtle}`,
      }}
    >
      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: SP[4],
          flexWrap: 'wrap',
        }}
      >
        <p
          style={{
            fontSize: TY.fontSize['2xs'],
            letterSpacing: TY.letterSpacing.tight,
            textTransform: 'uppercase',
            color: C.text.muted,
          }}
        >
          © 2026 SprintArena. Digital Velodrome Edition.
        </p>

        <div style={{ display: 'flex', gap: SP[8] }}>
          {['Privacy', 'Terms', 'Support'].map(label => (
            <FooterLink key={label} label={label} C={C} TY={TY} />
          ))}
        </div>
      </div>
    </footer>
  )
}

// ─── FooterLink ───────────────────────────────────────────────────────────────

function FooterLink({ label, C, TY }: { label: string; C: any; TY: any }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href="/login"
      style={{
        fontSize: TY.fontSize.xs,
        letterSpacing: TY.letterSpacing.tight,
        color: hovered ? C.accent.DEFAULT : C.text.secondary,
        transition: 'color 200ms ease',
        textDecoration: 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </Link>
  )
}
