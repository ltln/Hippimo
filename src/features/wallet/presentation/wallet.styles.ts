import { StyleSheet } from 'react-native'

import { Typography } from '@/config/constants/theme'

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 22,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.screenHeaderFontSize,
    fontWeight: '900',
    color: '#061710',
  },
  headerActions: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: '#F0F3F1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#0B1D17',
    fontSize: 14,
    paddingVertical: 0,
  },
  walletCard: {
    backgroundColor: '#128A3D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletName: {
    flex: 1,
    fontSize: 27,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
    marginTop: 28,
  },
  balanceBlock: {
    flex: 1,
  },
  balanceHighlight: {
    flex: 1.4,
    marginTop: 8,
  },
  walletMetaBlock: {
    flex: 1,
    alignItems: 'flex-start',
  },
  walletTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  walletTypeIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#BFEACD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTypeLabel: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: '#BFEACD',
  },
  balanceLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '900',
    color: '#9CD1AE',
  },
  balanceValue: {
    marginTop: 4,
    fontSize: 41,
    fontWeight: '900',
    color: '#FFCD24',
  },
  walletMetricRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 22,
    marginTop: 16,
  },
  walletMetric: {
    marginTop: 12,
  },
  incomeLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#9CD1AE',
  },
  incomeValue: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '900',
    color: '#79F4A6',
  },
  spentLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#9CD1AE',
  },
  spentValue: {
    marginTop: 4,
    fontSize: 23,
    fontWeight: '900',
    color: '#FFB0A4',
  },
  recentTitle: {
    marginTop: 22,
    marginBottom: 8,
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  transactionRow: {
    minHeight: 72,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.48)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  transactionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionMain: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  transferSubtitle: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '800',
    color: '#C9E8D4',
  },
  transactionAmountBlock: {
    alignItems: 'flex-end',
    maxWidth: 112,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  transactionDate: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '800',
    color: '#CDECD9',
  },
  emptyText: {
    paddingVertical: 16,
    color: '#DDF5E6',
    fontSize: 13,
    fontWeight: '800',
  },
})
