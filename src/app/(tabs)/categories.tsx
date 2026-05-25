import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useMemo, useState, type ComponentProps } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { Typography } from '@/config/constants/theme'
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '@/features/category/data/category-api'
import { useCategories } from '@/features/category/data/use-categories'
import type { Category, CategoryType } from '@/features/category/domain/category.types'
import { useAuth } from '@/features/auth/data/auth-context'
import { getCategoryColor, getCategoryIcon } from '@/features/transaction/utils/transaction-form'
import { confirmDelete } from '@/shared/utils/confirm-delete'

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name']
type TypeFilter = 'ALL' | CategoryType

const typeFilters: { label: string; value: TypeFilter }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chi tiêu', value: 'EXPENSE' },
  { label: 'Thu nhập', value: 'INCOME' },
]

const typeLabels: Record<CategoryType, string> = {
  EXPENSE: 'Chi tiêu',
  INCOME: 'Thu nhập',
}

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`)
    return
  }

  Alert.alert(title, message)
}

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets()
  const { authResponse } = useAuth()
  const accessToken = authResponse?.tokens.accessToken
  const { categories, error, isLoading, refresh } = useCategories({ status: 'ACTIVE' })
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const visibleCategories = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return categories.filter((category) => {
      const matchesType = typeFilter === 'ALL' || category.type === typeFilter
      const matchesSearch =
        !normalizedQuery || category.name.toLowerCase().includes(normalizedQuery)

      return matchesType && matchesSearch
    })
  }, [categories, searchQuery, typeFilter])

  const openCreateForm = () => {
    setEditingCategory(null)
    setIsFormOpen(true)
  }

  const openEditForm = (category: Category) => {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  const handleDelete = (category: Category) => {
    if (!accessToken) {
      Alert.alert('Chưa đăng nhập', 'Bạn cần đăng nhập để xóa danh mục.')
      return
    }

    confirmDelete('Xóa danh mục', `Bạn có chắc muốn xóa ${category.name}?`, async () => {
      try {
        await deleteCategory(category.categoryId, accessToken)
        await refresh()
      } catch (err) {
        Alert.alert(
          'Không xóa được danh mục',
          err instanceof Error ? err.message : 'Vui lòng thử lại.',
        )
      }
    })
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 18, 34) }]}>
        <Pressable
          onPress={() => router.replace('/')}
          hitSlop={8}
          style={[styles.backButton, { top: Math.max(insets.top + 18, 34) }]}
        >
          <Ionicons name='arrow-back' size={27} color='#0B1D17' />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
          DANH MỤC
        </Text>
        <Pressable
          style={[styles.addButton, { top: Math.max(insets.top + 18, 34) - 2 }]}
          onPress={openCreateForm}
          hitSlop={8}
          accessibilityLabel='Thêm danh mục'
        >
          <Ionicons name='add' size={28} color='#0B1D17' />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 92 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.filterRow}>
          {typeFilters.map((filter) => (
            <Pressable
              key={filter.value}
              style={[styles.filterChip, typeFilter === filter.value && styles.filterChipActive]}
              onPress={() => setTypeFilter(filter.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  typeFilter === filter.value && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.searchBox}>
          <Ionicons name='search' size={20} color='#245442' />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder='Tìm kiếm theo tên danh mục'
            placeholderTextColor='#245442'
            style={styles.searchInput}
            autoCapitalize='none'
            autoCorrect={false}
          />
          {searchQuery ? (
            <Pressable
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
              hitSlop={8}
            >
              <Ionicons name='close-circle' size={19} color='#245442' />
            </Pressable>
          ) : null}
        </View>

        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color='#12392C' />
            <Text style={styles.stateText}>Đang tải danh mục...</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!isLoading && visibleCategories.length === 0 ? (
          <View style={styles.stateBox}>
            <MaterialCommunityIcons name='tag-outline' size={32} color='#245442' />
            <Text style={styles.stateText}>
              {searchQuery.trim()
                ? 'Không tìm thấy danh mục phù hợp.'
                : 'Chưa có danh mục trong database.'}
            </Text>
          </View>
        ) : null}

        <View style={styles.list}>
          {visibleCategories.map((category) => (
            <CategoryRow
              key={category.categoryId}
              category={category}
              onEdit={() => openEditForm(category)}
              onDelete={() => handleDelete(category)}
            />
          ))}
        </View>
      </ScrollView>

      <CategoryFormModal
        accessToken={accessToken}
        category={editingCategory}
        visible={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={async () => {
          setIsFormOpen(false)
          await refresh()
        }}
      />
    </SafeAreaView>
  )
}

function CategoryRow({
  category,
  onDelete,
  onEdit,
}: {
  category: Category
  onDelete: () => void
  onEdit: () => void
}) {
  const color = category.color || getCategoryColor(category.name)
  const icon = resolveCategoryIcon(category)

  return (
    <View style={styles.categoryRow}>
      <View style={[styles.categoryIcon, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={22} color='#FFFFFF' />
      </View>
      <View style={styles.categoryBody}>
        <Text style={styles.categoryName}>{category.name}</Text>
        <Text style={styles.categoryType}>{typeLabels[category.type]}</Text>
      </View>
      <View style={styles.rowActions}>
        <Pressable style={styles.iconButton} onPress={onEdit} hitSlop={8}>
          <MaterialCommunityIcons name='pencil-outline' size={20} color='#0B1D17' />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={onDelete} hitSlop={8}>
          <MaterialCommunityIcons name='trash-can-outline' size={20} color='#B3261E' />
        </Pressable>
      </View>
    </View>
  )
}

function CategoryFormModal({
  accessToken,
  category,
  onClose,
  onSaved,
  visible,
}: {
  accessToken?: string
  category: Category | null
  onClose: () => void
  onSaved: () => Promise<void>
  visible: boolean
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<CategoryType>('EXPENSE')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!visible) {
      return
    }

    setName(category?.name ?? '')
    setType(category?.type ?? 'EXPENSE')
  }, [category, visible])

  const handleSave = async () => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      showAlert('Thiếu tên danh mục', 'Bạn hãy nhập tên danh mục trước khi lưu.')
      return
    }

    if (!accessToken) {
      Alert.alert('Chưa đăng nhập', 'Bạn cần đăng nhập để lưu danh mục.')
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        name: trimmedName,
        type,
        icon: getCategoryIcon(trimmedName),
        color: getCategoryColor(trimmedName),
      }

      if (category) {
        await updateCategory(category.categoryId, payload, accessToken)
      } else {
        await createCategory(payload, accessToken)
      }

      await onSaved()
    } catch (err) {
      Alert.alert(
        'Không lưu được danh mục',
        err instanceof Error ? err.message : 'Vui lòng thử lại.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>{category ? 'Sửa danh mục' : 'Thêm danh mục'}</Text>
          <Text style={styles.inputLabel}>Tên danh mục</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder='Nhập tên danh mục'
            placeholderTextColor='#245442'
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Loại danh mục</Text>
          <View style={styles.typeRow}>
            {(['EXPENSE', 'INCOME'] as CategoryType[]).map((item) => (
              <Pressable
                key={item}
                style={[styles.typeButton, type === item && styles.typeButtonActive]}
                onPress={() => setType(item)}
              >
                <Text style={[styles.typeButtonText, type === item && styles.typeButtonTextActive]}>
                  {typeLabels[item]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            disabled={isSubmitting}
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>{isSubmitting ? 'ĐANG LƯU...' : 'LƯU'}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function resolveCategoryIcon(category: Category): MaterialIconName {
  const icon = category.icon?.trim()

  if (!icon || icon.includes('/') || icon.startsWith('http')) {
    return getCategoryIcon(category.name)
  }

  return icon as MaterialIconName
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FBF5',
  },
  content: {
    paddingHorizontal: 22,
    paddingBottom: 36,
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
  backButton: {
    position: 'absolute',
    left: 22,
    justifyContent: 'center',
    zIndex: 2,
  },
  headerTitle: {
    flex: 1,
    color: '#0B1D17',
    fontSize: Typography.screenHeaderFontSize,
    fontWeight: '900',
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 22,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  filterChip: {
    borderRadius: 999,
    backgroundColor: '#CFECC2',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: '#12392C',
  },
  filterChipText: {
    color: '#12392C',
    fontSize: 13,
    fontWeight: '900',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#CFECC2',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#0B1D17',
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  clearSearchButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: 10,
  },
  categoryRow: {
    minHeight: 68,
    borderRadius: 8,
    backgroundColor: '#79C77C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBody: {
    flex: 1,
    marginLeft: 12,
  },
  categoryName: {
    color: '#0C3025',
    fontSize: 15,
    fontWeight: '900',
  },
  categoryType: {
    marginTop: 3,
    color: '#245442',
    fontSize: 12,
    fontWeight: '800',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateBox: {
    minHeight: 90,
    borderRadius: 8,
    backgroundColor: '#CFECC2',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
    padding: 16,
  },
  stateText: {
    color: '#245442',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorBox: {
    borderRadius: 8,
    backgroundColor: '#FFE7E7',
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#8A1C1C',
    fontSize: 13,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#F7FBF5',
    padding: 18,
  },
  modalTitle: {
    color: '#0B1D17',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    color: '#245442',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: '#0B1D17',
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 18,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  typeButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: '#CFECC2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#12392C',
  },
  typeButtonText: {
    color: '#12392C',
    fontSize: 13,
    fontWeight: '900',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: '#79C77C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
})
