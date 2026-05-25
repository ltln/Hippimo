import { StyleSheet } from 'react-native'

import { Typography } from '@/config/constants/theme'

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FBF5',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 22,
    paddingBottom: 18,
    backgroundColor: '#F7FBF5',
    position: 'relative',
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
    right: 22,
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
    backgroundColor: '#CFECC2',
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
    backgroundColor: '#79C77C',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  walletHeaderText: {
    flex: 1,
  },
  walletName: {
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
    marginTop: 18,
  },
  balanceBlock: {
    flex: 1,
  },
  balanceHighlight: {
    width: '100%',
  },
  walletMetaBlock: {
    width: '100%',
    alignItems: 'flex-start',
  },
  walletTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 8,
  },
  walletTypeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#DDF2D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTypeLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    color: '#DDF2D2',
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E9F8E2',
  },
  balanceValue: {
    marginTop: 5,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
    color: '#FFCD24',
  },
  balanceCurrency: {
    fontSize: 20,
    color: 'rgba(255, 239, 141, 0.78)',
  },
  walletMetricRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 22,
    marginTop: 16,
  },
  walletMetric: {
    width: '100%',
    marginTop: 14,
  },
  incomeLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#E9F8E2',
  },
  incomeValue: {
    marginTop: 4,
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 27,
    color: '#79F4A6',
  },
  incomeCurrency: {
    fontSize: 15,
    color: 'rgba(185, 255, 208, 0.72)',
  },
  spentLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#E9F8E2',
  },
  spentValue: {
    marginTop: 4,
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 27,
    color: '#FFB0A4',
  },
  spentCurrency: {
    fontSize: 15,
    color: 'rgba(255, 216, 210, 0.72)',
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
    color: '#E9F8E2',
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
    color: '#E9F8E2',
  },
  emptyText: {
    paddingVertical: 16,
    color: '#E9F8E2',
    fontSize: 13,
    fontWeight: '800',
  },
})
