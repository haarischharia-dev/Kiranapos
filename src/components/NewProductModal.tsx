import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { openDatabase } from '../db/database';
import { upsertProduct } from '../db/productRepo';
import { useCartStore } from '../store/cartStore';

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
  const addItem = useCartStore((state) => state.addItem);

  // Sync incoming initialName when modal becomes visible
  useEffect(() => {
    if (visible) {
      setName(initialName);
      setPrice('');
      setError(null);
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
        synced_to_global: 0
      };

      await upsertProduct(db, newProduct);
      addItem(newProduct);
      console.log('Saved & Added to cart:', newProduct.name);
      onClose();
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>New Product Found</Text>
          
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={barcode}
            editable={false}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Product Name"
            value={name}
            onChangeText={(text) => {
              setError(null);
              setName(text);
            }}
            autoFocus={!initialName} // Focus name if it's empty
          />
          
          <TextInput
            style={styles.input}
            placeholder="Price (₹)"
            value={price}
            onChangeText={(text) => {
              setError(null);
              setPrice(text);
            }}
            keyboardType="numeric"
            autoFocus={!!initialName} // Focus price if name is pre-filled
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <View style={styles.modalActions}>
            <Button title="Cancel" onPress={onClose} color="red" />
            <Button testID="save-product-btn" title="Save" onPress={handleSaveProduct} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    marginBottom: 16,
  },
  disabledInput: {
    backgroundColor: '#eee',
    color: '#666',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});
