import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  ScrollView,
  Alert,
  Modal,
  Pressable
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../../../types/navigation';
import { productsApi } from '../../../api/products';
import { customersApi } from '../../../api/customers';
import { purchasesApi } from '../../../api/purchases';
import { theme } from '../../../theme';
import { AppText } from '../../../components/AppText';
import { Screen } from '../../../components/Screen';
import { AppButton } from '../../../components/AppButton';
import type { Product, ProductCategory, Customer } from '../../../types';

interface CartItem {
  product: Product;
  quantity: number;
}

export function PosScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const qc = useQueryClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');

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

  function normaliseSriLankanPhone(input: string): string | null {
    let digits = input.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = digits.slice(1);
    if (digits.startsWith('94')) digits = digits.slice(2);
    if (digits.length !== 9) return null;
    if (!digits.startsWith('7')) return null;
    return `+94${digits}`;
  }

  const createPhone = useMemo(() => normaliseSriLankanPhone(customerSearch), [customerSearch]);
  const showCreateCustomer =
    !selectedCustomer &&
    customerSearch.length >= 2 &&
    !customersQuery.isFetching &&
    (customersQuery.data?.length ?? 0) === 0;

  const createCustomerMutation = useMutation({
    mutationFn: async () => {
      const phone = createPhone;
      if (!phone) throw new Error('Enter a valid Sri Lankan mobile number (7XXXXXXXX after +94).');
      if (!newCustomerName.trim()) throw new Error('Enter customer name.');
      const res = await customersApi.create({ name: newCustomerName.trim(), phone });
      return (res as any).data ?? res;
    },
    onSuccess: (customer: Customer) => {
      setSelectedCustomer(customer);
      setCustomerSearch('');
      setNewCustomerName('');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to create customer');
    }
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
      if (!selectedCustomer) throw new Error('Select customer');
      if (cart.length === 0) throw new Error('Cart empty');

      const items = cart.map((ci) => ({
        productId: ci.product.id,
        name: ci.product.name,
        sku: ci.product.sku || null,
        unitPrice: Number(ci.product.price),
        quantity: ci.quantity,
      }));

      await purchasesApi.create({ customerId: selectedCustomer.id, items });
    },
    onSuccess: () => {
      Alert.alert('Success', 'Sale completed!');
      setCart([]);
      setSelectedCustomer(null);
      setCustomerSearch('');
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
            <Ionicons name="cube-outline" size={24} color={theme.colors.textMuted} />
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <AppText numberOfLines={1} style={styles.productName}>{item.name}</AppText>
        <AppText style={styles.productPrice}>Rs.{Number(item.price).toLocaleString()}</AppText>
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen padded={false} contentStyle={styles.container}>
      <Modal
        transparent
        visible={isMenuOpen}
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setIsMenuOpen(false)} />
        <View style={styles.menuDrawer}>
          <View style={styles.menuHeader}>
            <View>
              <AppText style={styles.menuTitle}>POS Menu</AppText>
              <AppText variant="caption" dim>Navigate without leaving POS</AppText>
            </View>
            <TouchableOpacity style={styles.menuClose} onPress={() => setIsMenuOpen(false)}>
              <Ionicons name="close" size={18} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.menuLinks}>
            <TouchableOpacity onPress={() => { setIsMenuOpen(false); navigation.navigate('Main', { screen: 'DashboardTab' } as any); }} style={styles.menuLink}>
              <AppText style={styles.menuLinkText}>Dashboard</AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setIsMenuOpen(false); navigation.navigate('Main', { screen: 'CustomersTab' } as any); }} style={styles.menuLink}>
              <AppText style={styles.menuLinkText}>Customers</AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setIsMenuOpen(false); navigation.navigate('Main', { screen: 'MoreTab', params: { screen: 'Purchases' } } as any); }} style={styles.menuLink}>
              <AppText style={styles.menuLinkText}>Sales</AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setIsMenuOpen(false); navigation.navigate('Main', { screen: 'GiftCardsTab' } as any); }} style={styles.menuLink}>
              <AppText style={styles.menuLinkText}>Gift Cards</AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setIsMenuOpen(false); navigation.navigate('Main', { screen: 'MoreTab', params: { screen: 'Messages' } } as any); }} style={styles.menuLink}>
              <AppText style={styles.menuLinkText}>Messages</AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setIsMenuOpen(false); navigation.navigate('Main', { screen: 'MoreTab', params: { screen: 'Rewards' } } as any); }} style={styles.menuLink}>
              <AppText style={styles.menuLinkText}>Rewards</AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setIsMenuOpen(false); navigation.navigate('Main', { screen: 'MoreTab', params: { screen: 'Users' } } as any); }} style={styles.menuLink}>
              <AppText style={styles.menuLinkText}>Staff</AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setIsMenuOpen(false); navigation.navigate('Main', { screen: 'PosTab' } as any); }} style={styles.menuLink}>
              <AppText style={styles.menuLinkText}>Products</AppText>
              <AppText variant="caption" dim>(POS)</AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setIsMenuOpen(false); navigation.navigate('Main', { screen: 'MoreTab', params: { screen: 'Settings' } } as any); }} style={styles.menuLink}>
              <AppText style={styles.menuLinkText}>Settings</AppText>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.menuExit}>
            <AppButton
              title="Exit POS (Back to Dashboard)"
              onPress={() => {
                setIsMenuOpen(false);
                navigation.navigate('Main', { screen: 'DashboardTab' } as any);
              }}
              variant="dangerSoft"
              style={{ height: 44 }}
            />
          </View>
        </View>
      </Modal>

      {/* Left: Products */}
      <View style={styles.leftPane}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 }}>
            <TouchableOpacity 
              onPress={() => setIsMenuOpen(true)}
              style={styles.menuBtn}
            >
              <Ionicons name="menu" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search..."
                value={search}
                onChangeText={setSearch}
              />
            </View>
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

        <FlatList 
          data={productsQuery.data}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          numColumns={3}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
        />
      </View>

      {/* Right: Cart (Always Visible) */}
      <View style={styles.rightPane}>
        <View style={styles.cartHeader}>
          <AppText style={styles.cartTitle}>Order</AppText>
          <TouchableOpacity onPress={() => setCart([])}>
            <AppText style={{ color: theme.colors.primary, fontSize: 12 }}>Clear</AppText>
          </TouchableOpacity>
        </View>

        {/* Customer */}
        <View style={styles.customerArea}>
          {selectedCustomer ? (
            <View style={styles.selectedCustomer}>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: 'bold', fontSize: 13 }}>{selectedCustomer.name}</AppText>
                <AppText variant="caption" dim>{selectedCustomer.phone}</AppText>
              </View>
              <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.customerSearchWrap}>
              <TextInput 
                style={styles.customerInput}
                placeholder="Find customer..."
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
                      <AppText style={{ fontSize: 12 }}>{c.name}</AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {showCreateCustomer && (
                <View style={styles.customerCreateBox}>
                  <AppText style={{ fontSize: 12, fontWeight: '800' }}>No customer found</AppText>
                  <AppText variant="caption" dim>Create customer and continue</AppText>
                  <TextInput
                    style={[styles.customerInput, { marginTop: 8 }]}
                    placeholder="Customer name"
                    value={newCustomerName}
                    onChangeText={setNewCustomerName}
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
                    <AppText variant="caption" dim style={{ flex: 1, fontFamily: 'monospace' }}>
                      {createPhone ? createPhone : 'Phone invalid'}
                    </AppText>
                    <TouchableOpacity
                      style={styles.createBtn}
                      disabled={createCustomerMutation.isPending}
                      onPress={() => createCustomerMutation.mutate()}
                    >
                      <AppText style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>
                        {createCustomerMutation.isPending ? 'Creating…' : 'Create'}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        <FlatList 
          data={cart}
          keyExtractor={item => item.product.id}
          contentContainerStyle={{ padding: 10 }}
          renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <View style={{ flex: 1 }}>
                <AppText numberOfLines={1} style={{ fontSize: 12, fontWeight: '600' }}>{item.product.name}</AppText>
                <AppText variant="caption" style={{ color: theme.colors.primary }}>Rs.{(Number(item.product.price) * item.quantity).toLocaleString()}</AppText>
              </View>
              <View style={styles.qtyControls}>
                <TouchableOpacity onPress={() => updateQty(item.product.id, -1)} style={styles.qtyBtn}>
                  <Ionicons name="remove" size={12} />
                </TouchableOpacity>
                <AppText style={styles.qtyText}>{item.quantity}</AppText>
                <TouchableOpacity onPress={() => updateQty(item.product.id, 1)} style={styles.qtyBtn}>
                  <Ionicons name="add" size={12} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        <View style={styles.sheetFooter}>
          <View style={styles.totalRow}>
            <AppText style={{ fontWeight: 'bold' }}>Total</AppText>
            <AppText style={{ fontWeight: 'bold', color: theme.colors.primary }}>Rs.{cartTotal.toLocaleString()}</AppText>
          </View>
          <AppButton 
            title="Checkout" 
            loading={checkoutMutation.isPending}
            onPress={() => checkoutMutation.mutate()}
            style={{ height: 40 }}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  leftPane: {
    flex: 1.8,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  rightPane: {
    flex: 1.2,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 10,
    backgroundColor: '#fff',
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colors.backgroundSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15,23,42,0.35)',
  },
  menuDrawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: 290,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    ...theme.spacing.shadows.lg,
  },
  menuHeader: {
    padding: 14,
    paddingTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  menuClose: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  menuLinks: {
    padding: 10,
    gap: 6,
  },
  menuLink: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.backgroundSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuLinkText: {
    fontSize: 14,
    fontWeight: '800',
  },
  menuExit: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 14,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  categoryPillActive: {
    backgroundColor: theme.colors.primary,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  categoryTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1.2,
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
    padding: 6,
  },
  productName: {
    fontWeight: '700',
    fontSize: 11,
  },
  productPrice: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: '#fff',
  },
  cartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  customerArea: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  customerSearchWrap: {
    position: 'relative',
  },
  customerInput: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 12,
  },
  customerDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
    zIndex: 10,
  },
  customerResultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  customerCreateBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    backgroundColor: '#fff',
  },
  createBtn: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 2,
  },
  qtyBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    width: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sheetFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: '#fff',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  }
});
