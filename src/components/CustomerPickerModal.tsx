import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Customer } from '../types/db';
import { openDatabase } from '../db/database';
import { searchCustomers, upsertCustomerAndCharge, addKhataEntry } from '../db/khataRepo';

import { CartItem } from '../store/cartStore';
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing } from '@/constants/kirana-design';

interface CustomerPickerModalProps {
  visible: boolean;
  remainingDebt: number;
  cartItems: CartItem[];
  onClose: () => void;
  onComplete: () => void;
}

export default function CustomerPickerModal({ visible, remainingDebt, cartItems, onClose, onComplete }: CustomerPickerModalProps) {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Creation Mode State
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    if (visible) {
      setQuery('');
      setNewName('');
      setNewPhone('');
      setCustomers([]);
      setIsCreating(false);
    }
  }, [visible]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const db = await openDatabase();
        // If empty query, maybe fetch top 20 recent. For now, empty query returns all via LIKE '%%'
        const results = await searchCustomers(db, query.trim());
        setCustomers(results);
      } catch (err) {
        console.error('Failed to search customers', err);
      }
    };

    const debounceId = setTimeout(fetchCustomers, 200);
    return () => clearTimeout(debounceId);
  }, [query]);

  const handleSelectExisting = async (customerId: string) => {
    try {
      const db = await openDatabase();
      await addKhataEntry(db, customerId, remainingDebt, 'debit', cartItems);
      console.log(`🖨️ Printing Khata Bill... (Added ₹${remainingDebt} to Khata)`);
      onComplete();
    } catch (err) {
      console.error('Failed to add khata entry', err);
    }
  };

  const handleOpenCreateForm = () => {
    setNewName(query.trim());
    setNewPhone('');
    setIsCreating(true);
  };

  const handleUpsertCustomer = async () => {
    const sanitizedName = newName.trim().substring(0, 50);
    const sanitizedPhone = newPhone.replace(/\D/g, '');
    
    if (!sanitizedName || sanitizedPhone.length !== 10) {
      alert("Invalid input: Please provide a valid name and exactly 10 digits for the phone number.");
      return;
    }
    
    try {
      const db = await openDatabase();
      await upsertCustomerAndCharge(db, sanitizedName, sanitizedPhone, remainingDebt, cartItems);
      console.log(`🖨️ Printing Khata Bill... (Added ₹${remainingDebt} to Khata)`);
      onComplete();
    } catch (err) {
      console.error('Failed to upsert customer and charge', err);
    }
  };

  const exactMatchExists = customers.some(c => c.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={isCreating ? () => setIsCreating(false) : onClose} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Customer</Text>
            <View style={{ width: 60 }} />
          </View>

          {isCreating ? (
            <View style={styles.createForm}>
              <Text style={styles.formLabel}>Charging to Khata</Text>
              <Text style={styles.formDebtValue}>₹{remainingDebt.toFixed(2)}</Text>

              <TextInput
                style={styles.input}
                placeholder="Customer Name"
                value={newName}
                onChangeText={setNewName}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number (10 digits)"
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
                autoFocus={true}
              />
              <TouchableOpacity
                style={[styles.saveBtn, (!newName.trim() || !newPhone.trim()) && styles.disabledBtn]}
                onPress={handleUpsertCustomer}
                disabled={!newName.trim() || !newPhone.trim()}
              >
                <Text style={styles.saveBtnText}>Save & Charge Khata</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search Name or Phone..."
                  value={query}
                  onChangeText={setQuery}
                  autoFocus={true}
                />
              </View>

              <FlatList
                data={customers}
                keyExtractor={(c) => c.id}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={() => (
                  query.trim() !== '' && !exactMatchExists ? (
                    <TouchableOpacity style={styles.stickyCreateBtn} onPress={handleOpenCreateForm}>
                      <Text style={styles.stickyCreateText}>+ Add "{query.trim()}" to Khata</Text>
                    </TouchableOpacity>
                  ) : null
                )}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.customerRow} onPress={() => handleSelectExisting(item.id)}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.customerInfo}>
                      <Text style={styles.customerName}>{item.name}</Text>
                      <Text style={styles.customerPhone}>{item.phone}</Text>
                    </View>
                    <View style={styles.balanceInfo}>
                      <Text style={styles.dueLabel}>DUE</Text>
                      <Text style={styles.dueValue}>₹{item.outstanding_balance.toFixed(2)}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: KiranaColors.background,
  },
  container: {
    flex: 1,
    backgroundColor: KiranaColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: KiranaSpacing.gutter,
    paddingVertical: 16,
    borderBottomWidth: KiranaBorder.hairline,
    borderBottomColor: KiranaColors.outlineVariant,
    backgroundColor: KiranaColors.surface,
  },
  backBtn: {
    padding: 8,
    width: 60,
  },
  backBtnText: {
    color: KiranaColors.primary,
    fontSize: 16,
    fontFamily: 'WorkSans_600SemiBold',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Anybody_600SemiBold',
    color: KiranaColors.onSurface,
  },
  searchContainer: {
    padding: KiranaSpacing.gutter,
    backgroundColor: KiranaColors.surfaceContainer,
    borderBottomWidth: KiranaBorder.hairline,
    borderBottomColor: KiranaColors.outlineVariant,
  },
  searchInput: {
    backgroundColor: KiranaColors.surface,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    borderRadius: KiranaRadius.md,
    padding: 16,
    fontSize: 18,
    fontFamily: 'WorkSans_400Regular',
    color: KiranaColors.onSurface,
  },
  list: {
    flex: 1,
  },
  stickyCreateBtn: {
    backgroundColor: KiranaColors.surfaceDim,
    padding: 20,
    borderBottomWidth: KiranaBorder.hairline,
    borderBottomColor: KiranaColors.outlineVariant,
    alignItems: 'center',
  },
  stickyCreateText: {
    color: KiranaColors.owed,
    fontSize: 16,
    fontFamily: 'ArchivoNarrow_700Bold',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: KiranaBorder.hairline,
    borderBottomColor: KiranaColors.outlineVariant,
    backgroundColor: KiranaColors.surface,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: KiranaRadius.sm,
    backgroundColor: KiranaColors.primaryContainer,
    borderWidth: KiranaBorder.hairline,
    borderColor: KiranaColors.navy,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: KiranaColors.navy,
    fontSize: 20,
    fontFamily: 'ArchivoNarrow_700Bold',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontFamily: 'WorkSans_600SemiBold',
    color: KiranaColors.onSurface,
  },
  customerPhone: {
    fontSize: 14,
    fontFamily: 'WorkSans_400Regular',
    color: KiranaColors.onSurfaceVariant,
    marginTop: 4,
  },
  balanceInfo: {
    alignItems: 'flex-end',
  },
  dueLabel: {
    fontSize: 10,
    color: KiranaColors.owed,
    fontFamily: 'ArchivoNarrow_700Bold',
  },
  dueValue: {
    fontSize: 16,
    fontFamily: 'JetBrainsMono_700Bold',
    color: KiranaColors.owed,
  },
  createForm: {
    padding: KiranaSpacing.marginPage,
    flex: 1,
  },
  formLabel: {
    fontSize: 16,
    fontFamily: 'WorkSans_400Regular',
    color: KiranaColors.onSurfaceVariant,
    textAlign: 'center',
  },
  formDebtValue: {
    fontSize: 32,
    fontFamily: 'JetBrainsMono_700Bold',
    color: KiranaColors.owed,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: KiranaColors.surface,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    borderRadius: KiranaRadius.md,
    padding: 16,
    fontSize: 18,
    fontFamily: 'WorkSans_400Regular',
    marginBottom: 16,
    color: KiranaColors.onSurface,
  },
  saveBtn: {
    backgroundColor: KiranaColors.primaryContainer,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.navy,
    paddingVertical: 18,
    borderRadius: KiranaRadius.md,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledBtn: {
    backgroundColor: KiranaColors.outlineVariant,
  },
  saveBtnText: {
    color: KiranaColors.navy,
    fontSize: 18,
    fontFamily: 'ArchivoNarrow_700Bold',
  },
});
