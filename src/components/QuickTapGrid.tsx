import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  FlatList,
  Modal,
  TextInput,
  Button,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Vibration,
} from 'react-native';
import { Product } from '../types/db';
import { openDatabase } from '../db/database';
import {
  topLooseItems,
  upsertProduct,
  findLooseByDisplayName,
  deleteLooseProduct,
} from '../db/productRepo';
import { useLooseQuickTap } from '../hooks/useLooseQuickTap';
import LooseCalculatorModal from './LooseCalculatorModal';

function buildLooseDisplayName(name: string, baseQuantity: string, unit: string): string {
  return `${name.trim()} (${baseQuantity.trim()} ${unit})`;
}

export default function QuickTapGrid() {
  const [looseItems, setLooseItems] = useState<Product[]>([]);
  const quickTap = useLooseQuickTap();

  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [unit, setUnit] = useState<'kg' | 'liter' | 'grams'>('kg');
  const [baseQuantity, setBaseQuantity] = useState('1');

  const fetchItems = useCallback(async () => {
    try {
      const db = await openDatabase();
      const items = await topLooseItems(db);
      setLooseItems(items);
    } catch (error) {
      console.error('Failed to load loose items:', error);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleUnitChange = (selectedUnit: 'kg' | 'liter' | 'grams') => {
    setUnit(selectedUnit);
    if (selectedUnit === 'grams') setBaseQuantity('100');
    else setBaseQuantity('1');
  };

  const handleLongPress = (product: Product) => {
    Vibration.vibrate(80);
    Alert.alert(
      'Remove loose item?',
      `Delete "${product.name}" from Quick Tap?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await openDatabase();
              await deleteLooseProduct(db, product.id);
              quickTap.clearSelectedIfDeleted(product.id);
              fetchItems();
            } catch (error) {
              console.error('Failed to delete loose product:', error);
              Alert.alert('Could not delete', 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSaveProduct = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Enter a product name before saving.');
      return;
    }

    const price = parseFloat(newPrice);
    if (!newPrice.trim() || isNaN(price) || price <= 0) {
      Alert.alert('Price required', 'Enter a valid price greater than zero.');
      return;
    }

    const sanitizedName = newName.trim().substring(0, 50);
    const parsedPrice = parseFloat(newPrice);
    
    if (!sanitizedName || isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert("Invalid input", "Please provide a valid product name and a rate greater than 0.");
      return;
    }

    try {
      const db = await openDatabase();
      const id = Math.random().toString(36).substring(2, 15);
      const barcode = 'LOOSE-' + Date.now();
      
      const formattedName = `${sanitizedName} (${baseQuantity} ${unit})`;

      await upsertProduct(db, {
        id,
        barcode,
        name: formattedName,
        price: parsedPrice,
        is_loose: 1,
        stock: 0,
        updated_at: new Date().toISOString(),
        synced_to_global: 0
      });

      setAddModalVisible(false);
      setNewName('');
      setNewPrice('');
      setBaseQuantity('1');
      setUnit('kg');
      fetchItems();
    } catch (error) {
      console.error('Failed to save loose product:', error);
    }
  };

  type GridItem = Product | { id: 'add-btn'; isAddButton: true };
  const gridData: GridItem[] = [{ id: 'add-btn', isAddButton: true }, ...looseItems];

  return (
    <View style={styles.container}>
      <FlatList
        data={gridData}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.gridContainer}
        renderItem={({ item }) => {
          if ('isAddButton' in item) {
            return (
              <TouchableOpacity
                testID="add-loose-btn"
                style={[styles.tile, styles.addTile]}
                onPress={() => setAddModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.addTileIcon}>+</Text>
                <Text style={styles.addTileText}>Add Loose</Text>
              </TouchableOpacity>
            );
          }

          const product = item as Product;
          return (
            <Pressable
              style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
              onPress={() => quickTap.openProduct(product)}
              onLongPress={() => handleLongPress(product)}
              delayLongPress={450}
            >
              <Text style={styles.tileName} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={styles.tilePrice}>₹{product.price.toFixed(2)}</Text>
            </Pressable>
          );
        }}
      />

      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Loose Item</Text>

            <TextInput
              testID="loose-name-input"
              style={styles.input}
              placeholder="Product Name (e.g., Loose Sugar)"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />

            <View style={styles.unitRow}>
              {['kg', 'liter', 'grams'].map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
                  onPress={() => handleUnitChange(u as 'kg' | 'liter' | 'grams')}
                >
                  <Text style={[styles.unitBtnText, unit === u && styles.unitBtnTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Base Qty</Text>
                <TextInput
                  style={styles.input}
                  value={baseQuantity}
                  onChangeText={setBaseQuantity}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.spacer} />
              <View style={styles.flex1}>
                <Text style={styles.label}>Price (₹)</Text>
                <TextInput
                  testID="loose-price-input"
                  style={styles.input}
                  placeholder="Rate"
                  value={newPrice}
                  onChangeText={setNewPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setAddModalVisible(false)} color="red" />
              <Button testID="save-loose-btn" title="Save Item" onPress={handleSaveProduct} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <LooseCalculatorModal
        visible={quickTap.calcModalVisible}
        product={quickTap.selectedProduct}
        displayUnit={quickTap.displayUnit}
        inputQty={quickTap.inputQty}
        inputAmt={quickTap.inputAmt}
        qtyShortcuts={quickTap.qtyShortcuts}
        amtShortcuts={quickTap.amtShortcuts}
        onClose={quickTap.closeCalculator}
        onQtyChange={quickTap.handleQtyChange}
        onAmtChange={quickTap.handleAmtChange}
        onToggleUnit={quickTap.toggleDisplayUnit}
        onAddToCart={quickTap.handleAddToCart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  gridContainer: { padding: 6 },
  tile: {
    flex: 1,
    aspectRatio: 1,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  tilePressed: { backgroundColor: '#f5f5f5', borderColor: '#ccc' },
  tileName: { fontSize: 14, fontWeight: '600', color: '#2d3436', textAlign: 'center', marginBottom: 4 },
  tilePrice: { fontSize: 12, color: '#00b894', fontWeight: '800' },
  addTile: { backgroundColor: '#e8f5e9', borderColor: '#4caf50', borderStyle: 'dashed', borderWidth: 2 },
  addTileIcon: { fontSize: 26, color: '#4caf50', fontWeight: 'bold', marginBottom: 2 },
  addTileText: { fontSize: 12, color: '#4caf50', fontWeight: '600', textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#000' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  unitRow: { flexDirection: 'row', marginBottom: 16 },
  unitBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ccc', alignItems: 'center' },
  unitBtnActive: { backgroundColor: '#00b894', borderColor: '#00b894' },
  unitBtnText: { fontSize: 16, color: '#333' },
  unitBtnTextActive: { color: '#fff', fontWeight: 'bold' },
  row: { flexDirection: 'row' },
  flex1: { flex: 1 },
  spacer: { width: 16 },
  label: { fontSize: 14, color: '#666', marginBottom: 4 },
});
