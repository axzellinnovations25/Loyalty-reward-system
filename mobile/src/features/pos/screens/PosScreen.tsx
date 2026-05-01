import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  ScrollView,
  Modal,
  Alert
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { productsApi } from '../../../api/products';
import { customersApi } from '../../../api/customers';
import { purchasesApi } from '../../../api/purchases';
import { theme } from '../../../theme';
import { AppText } from '../../../components/AppText';
import { Screen } from '../../../components/Screen';
import { Card } from '../../../components/Card';
import { AppButton } from '../../../components/AppButton';
import type { Product, ProductCategory, Customer } from '../../../types';

interface CartItem {
  product: Product;
  quantity: number;
}

export function PosScreen() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartVisible, setIsCartVisible] = useState(false);
  
  // Customer search in cart
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Queries
  const productsQuery = useQuery({
    queryKey: ['products', search, selectedCategoryId],
    queryFn: async () => {
      const res = await productsApi.list({ limit: 100, search: search || undefined, categoryId: selectedCategoryId || undefined });
      const payload = (res as any).data ?? res;
      return (payload.items ?? (Array.isArray(payload) ? payload : [])) as Product[];
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await productsApi.listCategories();
      const payload = (res as any).data ?? res;
      return (Array.isArray(payload) ? payload : []) as ProductCategory[];
    },
  });

  const customersQuery = useQuery({
    queryKey: ['customerSearch', customerSearch],
    enabled: customerSearch.length >= 2,
    queryFn: async () => {
      const res = await customersApi.list({ search: customerSearch, limit: 5 });
      const payload = (res as any).data ?? res;
      return (payload.items ?? (Array.isArray(payload) ? payload : [])) as Customer[];
    },
  });

  // Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
  }, [cart]);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomer) throw new Error('Please select a customer.');
      if (cart.length === 0) throw new Error('Cart is empty.');
      
      await purchasesApi.create({
        customerId: selectedCustomer.id,
        amount: cartTotal
      });
    },
    onSuccess: () => {
      Alert.alert('Success', 'Sale completed successfully!');
      setCart([]);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setIsCartVisible(false);
      qc.invalidateQueries({ queryKey: ['recentPurchases'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Checkout failed');
    }
  });

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => addToCart(item)}>
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="cube-outline" size={32} color={theme.colors.textMuted} />
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <AppText numberOfLines={1} style={styles.productName}>{item.name}</AppText>
        <AppText style={styles.productPrice}>Rs. {Number(item.price).toLocaleString()}</AppText>
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={theme.colors.textMuted} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity 
            style={[styles.categoryPill, !selectedCategoryId && styles.categoryPillActive]}
            onPress={() => setSelectedCategoryId(null)}
          >
            <AppText style={[styles.categoryText, !selectedCategoryId && styles.categoryTextActive]}>All</AppText>
          </TouchableOpacity>
          {categoriesQuery.data?.map(cat => (
            <TouchableOpacity 
              key={cat.id}
              style={[styles.categoryPill, selectedCategoryId === cat.id && styles.categoryPillActive]}
              onPress={() => setSelectedCategoryId(cat.id)}
            >
              <AppText style={[styles.categoryText, selectedCategoryId === cat.id && styles.categoryTextActive]}>
                {cat.name}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product Grid */}
      <FlatList 
        data={productsQuery.data}
        renderItem={renderProduct}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
      />

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity style={styles.cartFab} onPress={() => setIsCartVisible(true)}>
          <View style={styles.cartCount}>
            <AppText style={styles.cartCountText}>{cart.reduce((a, b) => a + b.quantity, 0)}</AppText>
          </View>
          <Ionicons name="cart" size={28} color="#fff" />
          <AppText style={styles.cartFabTotal}>Rs. {cartTotal.toLocaleString()}</AppText>
        </TouchableOpacity>
      )}

      {/* Cart Modal */}
      <Modal visible={isCartVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.cartSheet}>
            <View style={styles.sheetHeader}>
              <AppText variant="h3">Current Order</AppText>
              <TouchableOpacity onPress={() => setIsCartVisible(false)}>
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Customer Selector */}
            <View style={styles.customerArea}>
              {selectedCustomer ? (
                <View style={styles.selectedCustomer}>
                  <View style={styles.customerIcon}>
                    <AppText style={{ color: '#fff', fontWeight: 'bold' }}>{selectedCustomer.name[0]}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText style={{ fontWeight: 'bold' }}>{selectedCustomer.name}</AppText>
                    <AppText variant="caption" dim>{selectedCustomer.phone}</AppText>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                    <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.customerSearchWrap}>
                  <TextInput 
                    style={styles.customerInput}
                    placeholder="Search customer for points..."
                    value={customerSearch}
                    onChangeText={setCustomerSearch}
                  />
                  {customersQuery.data && customerSearch.length >= 2 && (
                    <View style={styles.customerDropdown}>
                      {customersQuery.data.map(c => (
                        <TouchableOpacity 
                          key={c.id} 
                          style={styles.customerResultItem}
                          onPress={() => {
                            setSelectedCustomer(c);
                            setCustomerSearch('');
                          }}
                        >
                          <AppText>{c.name} ({c.phone})</AppText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Cart Items */}
            <FlatList 
              data={cart}
              keyExtractor={item => item.product.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={styles.cartItem}>
                  <AppText style={{ flex: 1 }}>{item.product.name}</AppText>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity onPress={() => updateQty(item.product.id, -1)} style={styles.qtyBtn}>
                      <Ionicons name="remove" size={16} />
                    </TouchableOpacity>
                    <AppText style={styles.qtyText}>{item.quantity}</AppText>
                    <TouchableOpacity onPress={() => updateQty(item.product.id, 1)} style={styles.qtyBtn}>
                      <Ionicons name="add" size={16} />
                    </TouchableOpacity>
                  </View>
                  <AppText style={styles.itemTotal}>
                    Rs. {(Number(item.product.price) * item.quantity).toLocaleString()}
                  </AppText>
                </View>
              )}
            />

            <View style={styles.sheetFooter}>
              <View style={styles.totalRow}>
                <AppText variant="h3">Total</AppText>
                <AppText variant="h3">Rs. {cartTotal.toLocaleString()}</AppText>
              </View>
              <AppButton 
                title="Complete Sale" 
                loading={checkoutMutation.isPending}
                onPress={() => checkoutMutation.mutate()}
                style={{ backgroundColor: theme.colors.primary }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  categoryTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.spacing.shadows.sm,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f8fafc',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  productPrice: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 15,
  },
  cartFab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: theme.colors.primary,
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    ...theme.spacing.shadows.lg,
  },
  cartCount: {
    position: 'absolute',
    top: -10,
    left: 40,
    backgroundColor: '#fff',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  cartCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  cartFabTotal: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 'auto',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  cartSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  customerArea: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: 12,
  },
  customerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerSearchWrap: {
    position: 'relative',
  },
  customerInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  customerDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
    zIndex: 10,
    ...theme.spacing.shadows.md,
  },
  customerResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    backgroundColor: '#fff',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    width: 30,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  itemTotal: {
    width: 100,
    textAlign: 'right',
    fontWeight: '700',
  },
  sheetFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  }
});
