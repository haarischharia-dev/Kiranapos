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
import { KiranaBorder, KiranaColors, KiranaRadius, KiranaSpacing } from '@/constants/kirana-design';

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
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: KiranaColors.modalBackdrop },
  modalContent: {
    backgroundColor: KiranaColors.surface,
    padding: KiranaSpacing.marginPage,
    borderTopLeftRadius: KiranaRadius.xl,
    borderTopRightRadius: KiranaRadius.xl,
    borderWidth: KiranaBorder.focus,
    borderColor: KiranaColors.navy,
  },
  calcHeader: {
    borderBottomWidth: KiranaBorder.hairline,
    borderBottomColor: KiranaColors.outlineVariant,
    paddingBottom: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  calcTitle: { fontSize: 24, fontFamily: 'Anybody_700Bold', color: KiranaColors.onSurface },
  calcRate: { fontSize: 14, fontFamily: 'WorkSans_400Regular', color: KiranaColors.onSurfaceVariant, marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: { fontSize: 14, fontFamily: 'ArchivoNarrow_700Bold', color: KiranaColors.onSurfaceVariant, marginBottom: 8 },
  toggleBtn: {
    backgroundColor: KiranaColors.surfaceDim,
    borderWidth: KiranaBorder.hairline,
    borderColor: KiranaColors.outlineVariant,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: KiranaRadius.sm,
  },
  toggleBtnText: { fontSize: 12, fontFamily: 'ArchivoNarrow_700Bold', color: KiranaColors.settled },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.outlineVariant,
    borderRadius: KiranaRadius.md,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: KiranaColors.surfaceDim,
  },
  largeInput: { flex: 1, fontSize: 24, fontFamily: 'JetBrainsMono_700Bold', paddingVertical: 16, color: KiranaColors.onSurface },
  inputSuffix: { fontSize: 18, fontFamily: 'WorkSans_600SemiBold', color: KiranaColors.onSurfaceVariant },
  inputPrefix: { fontSize: 24, fontFamily: 'JetBrainsMono_700Bold', color: KiranaColors.onSurfaceVariant, marginRight: 8 },
  quickTapRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  quickBtn: {
    backgroundColor: KiranaColors.surfaceDim,
    borderWidth: KiranaBorder.hairline,
    borderColor: KiranaColors.outlineVariant,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: KiranaRadius.sm,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickBtnText: { fontSize: 16, fontFamily: 'WorkSans_600SemiBold', color: KiranaColors.onSurface },
  addToCartBtn: {
    backgroundColor: KiranaColors.primaryContainer,
    borderWidth: KiranaBorder.card,
    borderColor: KiranaColors.navy,
    padding: 16,
    borderRadius: KiranaRadius.md,
    alignItems: 'center',
    marginTop: 10,
  },
  addToCartBtnText: { color: KiranaColors.navy, fontSize: 18, fontFamily: 'ArchivoNarrow_700Bold' },
  addToCartSubText: { color: KiranaColors.onSurfaceVariant, fontSize: 12, marginTop: 2, fontFamily: 'WorkSans_500Medium' },
  cancelBtn: { padding: 16, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: KiranaColors.onSurfaceVariant, fontSize: 16, fontFamily: 'WorkSans_600SemiBold' },
});
