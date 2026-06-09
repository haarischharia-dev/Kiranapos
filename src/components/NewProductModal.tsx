import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { openDatabase } from '../db/database';
import { upsertProduct } from '../db/productRepo';
import { useCartStore } from '../store/cartStore';
import KInput from './ui/KInput';
import KButton from './ui/KButton';
import KText from './ui/KText';
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing } from '@/constants/kirana-design';

interface NewProductModalProps {
  visible: boolean;
  barcode: string;
  initialName: string;
  onClose: () => void;
}

export default function NewProductModal({ visible, barcode, initialName, onClose }: NewProductModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setPrice('');
      setError(null);
      setIsSaving(false);
    }
  }, [visible, initialName]);

  const handleSaveProduct = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Name cannot be empty');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Price must be a valid positive number');
      return;
    }

    const sanitizedName = cleanName.substring(0, 50);
    setIsSaving(true);

    try {
      const db = await openDatabase();
      const id = Math.random().toString(36).substring(2, 15);

      const newProduct = {
        id,
        barcode,
        name: sanitizedName,
        price: parsedPrice,
        is_loose: 0,
        stock: 0,
        updated_at: new Date().toISOString(),
        synced_to_global: 0,
      };

      await upsertProduct(db, newProduct);
      addItem(newProduct);
      onClose();
    } catch (saveError) {
      console.error('Failed to save product:', saveError);
      setError('Could not save product. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.statusBanner}>
          <KText variant="labelCaps" style={styles.statusText}>Adding to Inventory</KText>
        </View>

        <View style={styles.modalCard}>
          <KText variant="headlineMd" style={styles.modalTitle}>New Product Found</KText>
          <KText variant="bodyMd" style={styles.modalSub}>
            Save this barcode to your local catalogue and add it to the bill.
          </KText>

          <KInput label="Barcode" value={barcode} editable={false} style={styles.disabledInput} />
          <KInput
            label="Product Name"
            placeholder="Product Name"
            value={name}
            onChangeText={(text) => {
              setError(null);
              setName(text);
            }}
            autoFocus={!initialName}
            error={error && !name.trim() ? error : null}
          />
          <KInput
            label="Price (₹)"
            placeholder="0.00"
            value={price}
            onChangeText={(text) => {
              setError(null);
              setPrice(text);
            }}
            keyboardType="numeric"
            autoFocus={!!initialName}
            error={error && name.trim() ? error : null}
          />

          <View style={styles.modalActions}>
            <KButton label="Cancel" variant="secondary" onPress={onClose} style={styles.actionBtn} />
            <KButton
              testID="save-product-btn"
              label="Save & Add"
              onPress={handleSaveProduct}
              loading={isSaving}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: KiranaSpacing.marginPage,
    backgroundColor: KiranaColors.modalBackdrop,
  },
  statusBanner: {
    alignSelf: 'center',
    backgroundColor: KiranaColors.primaryContainer,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.onPrimaryContainer,
    borderRadius: KiranaRadius.md,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 16,
  },
  statusText: {
    color: KiranaColors.navy,
    fontSize: 13,
  },
  modalCard: {
    backgroundColor: KiranaColors.surface,
    borderWidth: KiranaBorder.focus,
    borderColor: KiranaColors.navy,
    borderRadius: KiranaRadius.lg,
    padding: KiranaSpacing.marginPage,
  },
  modalTitle: {
    marginBottom: 6,
  },
  modalSub: {
    color: KiranaColors.onSurfaceVariant,
    marginBottom: 16,
  },
  disabledInput: {
    backgroundColor: KiranaColors.surfaceDim,
    color: KiranaColors.onSurfaceVariant,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
  },
});
