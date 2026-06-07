import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Product } from '../types/db';

interface Shortcut {
  label: string;
  val: number;
}

interface LooseCalculatorModalProps {
  visible: boolean;
  product: Product | null;
  displayUnit: string;
  inputQty: string;
  inputAmt: string;
  qtyShortcuts: Shortcut[];
  amtShortcuts: number[];
  onClose: () => void;
  onQtyChange: (text: string) => void;
  onAmtChange: (text: string) => void;
  onToggleUnit: () => void;
  onAddToCart: () => void;
}

export default function LooseCalculatorModal({
  visible,
  product,
  displayUnit,
  inputQty,
  inputAmt,
  qtyShortcuts,
  amtShortcuts,
  onClose,
  onQtyChange,
  onAmtChange,
  onToggleUnit,
  onAddToCart,
}: LooseCalculatorModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          {product && (
            <>
              <View style={styles.calcHeader}>
                <Text style={styles.calcTitle}>{product.name}</Text>
                <Text style={styles.calcRate}>Base Rate: ₹{product.price.toFixed(2)}</Text>
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Enter Quantity</Text>
                <TouchableOpacity style={styles.toggleBtn} onPress={onToggleUnit}>
                  <Text style={styles.toggleBtnText}>
                    Switch to{' '}
                    {displayUnit === 'kg'
                      ? 'g'
                      : displayUnit === 'g'
                        ? 'kg'
                        : displayUnit === 'liter'
                          ? 'ml'
                          : 'liter'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.largeInput}
                  value={inputQty}
                  onChangeText={onQtyChange}
                  keyboardType="numeric"
                  autoFocus
                />
                <Text style={styles.inputSuffix}>{displayUnit}</Text>
              </View>

              <View style={styles.quickTapRow}>
                {qtyShortcuts.map((sc) => (
                  <TouchableOpacity
                    key={sc.label}
                    style={styles.quickBtn}
                    onPress={() => onQtyChange(sc.val.toString())}
                  >
                    <Text style={styles.quickBtnText}>{sc.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Or Enter Cash Amount (₹)</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputPrefix}>₹</Text>
                <TextInput
                  style={styles.largeInput}
                  value={inputAmt}
                  onChangeText={onAmtChange}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.quickTapRow}>
                {amtShortcuts.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={styles.quickBtn}
                    onPress={() => onAmtChange(amt.toString())}
                  >
                    <Text style={styles.quickBtnText}>₹{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity testID="add-to-cart-btn" style={styles.addToCartBtn} onPress={onAddToCart}>
                <Text style={styles.addToCartBtnText}>
                  ADD TO CART - ₹{parseFloat(inputAmt) ? parseFloat(inputAmt).toFixed(2) : '0.00'}
                </Text>
                <Text style={styles.addToCartSubText}>
                  for{' '}
                  {parseFloat(inputQty) ? parseFloat(inputQty).toFixed(3).replace(/\.?0+$/, '') : '0'}{' '}
                  {displayUnit}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  calcHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  calcTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  calcRate: { fontSize: 14, color: '#888', marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  toggleBtn: { backgroundColor: '#eef2f5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  toggleBtnText: { fontSize: 12, fontWeight: 'bold', color: '#00b894' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  largeInput: { flex: 1, fontSize: 24, fontWeight: 'bold', paddingVertical: 16, color: '#333' },
  inputSuffix: { fontSize: 18, color: '#666', fontWeight: 'bold' },
  inputPrefix: { fontSize: 24, color: '#666', fontWeight: 'bold', marginRight: 8 },
  quickTapRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  quickBtn: {
    backgroundColor: '#eef2f5',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickBtnText: { fontSize: 16, fontWeight: '700', color: '#2d3436' },
  addToCartBtn: { backgroundColor: '#00b894', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  addToCartBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  addToCartSubText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2, fontWeight: '500' },
  cancelBtn: { padding: 16, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: '#888', fontSize: 16, fontWeight: '600' },
});
