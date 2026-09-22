import { useMemo } from 'react';
import { useTheme } from '@material-ui/core';

export type PaletteMode = 'light' | 'dark';

export type DbmlPalette = {
  frameBg: string;
  text: string;
  border: string;
  divider: string;
  muted: string;
  canvasBg: string;
  nodeBg: string;
  nodeBorder: string;
  rowBorder: string;
  header: string;
  headerText: string;
  handle: string;
  edge: string;
  edgeActive: string;
  buttonBorder: string;
  activeBg: string;
  activeText: string;
  errorBorder: string;
  code: {
    comment: string;
    string: string;
    keyword: string;
    type: string;
    setting: string;
    backtick: string;
    operator: string;
    color: string;
  };
};

export const PALETTES: Record<PaletteMode, DbmlPalette> = {
  light: {
    frameBg: '#ffffff',
    text: '#263238',
    border: '#9e9e9e',
    divider: '#e0e0e0',
    muted: '#78909c',
    canvasBg: '#fafafa',
    nodeBg: '#ffffff',
    nodeBorder: '#90a4ae',
    rowBorder: '#eceff1',
    header: '#37474f',
    headerText: '#ffffff',
    handle: '#78909c',
    edge: '#90a4ae',
    edgeActive: '#1976d2',
    buttonBorder: '#b0bec5',
    activeBg: '#37474f',
    activeText: '#ffffff',
    errorBorder: '#c62828',
    code: {
      comment: '#689f38',
      string: '#2e7d32',
      keyword: '#1565c0',
      type: '#d84315',
      setting: '#90a4ae',
      backtick: '#6a1b9a',
      operator: '#f9a825',
      color: '#546e7a',
    },
  },
  dark: {
    frameBg: '#212121',
    text: '#e0e0e0',
    border: '#616161',
    divider: '#424242',
    muted: '#90a4ae',
    canvasBg: '#1a1a1a',
    nodeBg: '#2a2a2a',
    nodeBorder: '#607d8b',
    rowBorder: '#383838',
    header: '#37474f',
    headerText: '#ffffff',
    handle: '#90a4ae',
    edge: '#78909c',
    edgeActive: '#64b5f6',
    buttonBorder: '#616161',
    activeBg: '#eceff1',
    activeText: '#212121',
    errorBorder: '#ef5350',
    code: {
      comment: '#7cb342',
      string: '#81c784',
      keyword: '#64b5f6',
      type: '#ff8a65',
      setting: '#78909c',
      backtick: '#ce93d8',
      operator: '#ffd54f',
      color: '#b0bec5',
    },
  },
};

/**
 * Calm cycle for TableGroup accents when the DBML sets no [color: #...],
 * indexed by group declaration order. Light tones are dark enough for
 * text on paper; dark tones are lifted for contrast on dark canvases.
 */
export const GROUP_COLORS: Record<PaletteMode, string[]> = {
  light: ['#5c6bc0', '#26a69a', '#8d6e63', '#7e57c2', '#66bb6a', '#78909c'],
  dark: ['#7986cb', '#4db6ac', '#a1887f', '#9575cd', '#81c784', '#90a4ae'],
};

/**
 * Resolves the widget palette from the active Backstage MUI theme, so the
 * widget matches the app theme (custom company themes included) rather
 * than a fixed color set. The addon and its portals render inside the
 * app's ThemeProvider, so this works both in the TechDocs shadow root and
 * in the dialog. Syntax token colors have no MUI equivalent and stay
 * per-mode; the static PALETTES double as fallbacks outside a provider.
 */
export const useDbmlTheme = (): { mode: PaletteMode; palette: DbmlPalette } => {
  const theme = useTheme();
  const mode: PaletteMode = theme?.palette?.type === 'dark' ? 'dark' : 'light';
  const palette = useMemo(() => {
    const base = PALETTES[mode];
    const p = theme?.palette;
    if (!p) {
      return base;
    }
    return {
      frameBg: p.background?.paper ?? base.frameBg,
      text: p.text?.primary ?? base.text,
      border: p.divider ?? base.border,
      divider: p.divider ?? base.divider,
      muted: p.text?.secondary ?? base.muted,
      canvasBg: p.background?.default ?? base.canvasBg,
      nodeBg: p.background?.paper ?? base.nodeBg,
      nodeBorder: p.divider ?? base.nodeBorder,
      rowBorder: p.divider ?? base.rowBorder,
      header: p.primary?.main ?? base.header,
      headerText: p.primary?.contrastText ?? base.headerText,
      handle: p.text?.secondary ?? base.handle,
      edge: p.text?.secondary ?? base.edge,
      edgeActive: mode === 'light' ? p.primary?.main ?? base.edgeActive : base.edgeActive,
      buttonBorder: p.divider ?? base.buttonBorder,
      activeBg: p.primary?.main ?? base.activeBg,
      activeText: p.primary?.contrastText ?? base.activeText,
      errorBorder: p.error?.main ?? base.errorBorder,
      code: base.code,
    };
  }, [theme, mode]);
  return { mode, palette };
};
