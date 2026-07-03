import { useState, useEffect } from 'react';

export default function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (window.innerWidth > 600) {
        if (!target.classList.contains('close-ignore')) setOpen(false);
      } else {
        if (target.id !== 'btn_menu') setOpen(false);
      }
    };
    document.body.addEventListener('click', handleClick);
    return () => document.body.removeEventListener('click', handleClick);
  }, []);

  const scrollTo = (id: string) => {
    const container = document.querySelector('.container') as HTMLElement;
    const target = document.querySelector(id) as HTMLElement;
    if (!container || !target) return;
    const to = target.offsetTop + container.scrollTop - 5;
    container.scrollTo({ top: to, behavior: 'smooth' });
    setOpen(false);
  };

  const links = [
    { href: '#top',        label: 'トップ' },
    { href: '#summary',    label: '大会概要' },
    // { href: '#result',     label: '対戦表・トーナメント表' },
    { href: '#entry',      label: 'エントリー' },
    // { href: '#timetable',  label: 'タイムテーブル' },
    // { href: '#regulation', label: '大会ルール' },
    { href: '#others',     label: 'その他' },
    // { href: '#env',        label: '　当日の対戦環境について' },
    // { href: '#volunteers', label: '　運営ボランティア募集' },
    { href: '#archive',    label: '　アーカイブ（過去大会）' },
    // { href: '#after',      label: '　後夜祭' },
    // { href: '#party',      label: '　打ち上げについて' },
    { href: '#staff',      label: '公式アカウント・スタッフ一覧' },
  ];

  return (
    <nav className={`gnav${open ? ' menu_open' : ''}`}>
      <i
        id="btn_menu"
        className="fa fa-bars close-ignore"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
      />
      <ul>
        {links.map(link => (
          <li key={link.href}>
            <a
              href={link.href}
              className="close-ignore"
              onClick={(e) => { e.preventDefault(); scrollTo(link.href); }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
