import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, glass, radius, spacing } from '../../../core/theme';
import { AppButton } from '../../components/AppButton';
import { useProductsCatalog } from '../../hooks/useProductsCatalog';

export const ProductsCatalogScreen = (): React.JSX.Element => {
  const {
    products,
    searchInput,
    setSearchInput,
    submittedQuery,
    isLoading,
    listError,
    selectedProductId,
    selectedProduct,
    isLoadingDetail,
    detailError,
    failedImageIds,
    submitSearch,
    retryProducts,
    loadProductDetail,
    returnToCatalog,
    markImageFailed,
  } = useProductsCatalog();

  if (selectedProductId !== null) {
    const detailImageUri =
      selectedProduct && !failedImageIds.has(selectedProduct.id)
        ? selectedProduct.thumbnail
        : undefined;

    return (
      <ScrollView contentContainerStyle={styles.content}>
        <AppButton
          text="Volver al catálogo"
          onPress={returnToCatalog}
          variant="secondary"
        />
        {isLoadingDetail ? (
          <Text accessibilityRole="progressbar" style={styles.message}>
            Cargando producto...
          </Text>
        ) : null}
        {detailError ? (
          <View>
            <Text accessibilityRole="alert" style={styles.error}>
              {detailError}
            </Text>
            <AppButton
              text="Reintentar detalle"
              onPress={() => {
                loadProductDetail(selectedProductId).then(() => undefined);
              }}
              variant="primary"
            />
          </View>
        ) : null}
        {selectedProduct ? (
          <View style={styles.detail}>
            {detailImageUri ? (
              <Image
                accessibilityLabel={`Imagen de ${selectedProduct.title}`}
                onError={() => markImageFailed(selectedProduct.id)}
                source={{ uri: detailImageUri }}
                style={styles.detailImage}
              />
            ) : null}
            <Text style={styles.productTitle}>{selectedProduct.title}</Text>
            <Text style={styles.productMeta}>{selectedProduct.category}</Text>
            <Text style={styles.price}>
              ${selectedProduct.price.toFixed(2)}
            </Text>
            <Text style={styles.description}>
              {selectedProduct.description}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Catálogo de productos</Text>
      <TextInput
        accessibilityLabel="Buscar productos"
        onChangeText={setSearchInput}
        onSubmitEditing={submitSearch}
        placeholder="Buscar por nombre"
        placeholderTextColor={colors.textSecondary}
        returnKeyType="search"
        selectionColor={colors.primary}
        style={styles.searchInput}
        value={searchInput}
      />
      <AppButton text="Buscar" onPress={submitSearch} variant="primary" />
      {isLoading ? (
        <Text accessibilityRole="progressbar" style={styles.message}>
          {products.length === 0
            ? 'Cargando productos...'
            : 'Actualizando resultados...'}
        </Text>
      ) : null}
      {listError ? (
        <View style={styles.errorContainer}>
          <Text accessibilityRole="alert" style={styles.error}>
            {listError}
          </Text>
          <AppButton
            text={submittedQuery ? 'Reintentar búsqueda' : 'Reintentar listado'}
            onPress={retryProducts}
            variant="secondary"
          />
        </View>
      ) : null}
      {!isLoading && !listError && products.length === 0 ? (
        <Text style={styles.message}>
          {submittedQuery
            ? 'No se encontraron productos para esta búsqueda.'
            : 'No hay productos disponibles.'}
        </Text>
      ) : null}
      {products.map(product => (
        <Pressable
          accessibilityRole="button"
          key={product.id}
          onPress={() => {
            loadProductDetail(product.id).then(() => undefined);
          }}
          style={styles.productCard}
          testID={`product-${product.id}`}
        >
          {product.thumbnail && !failedImageIds.has(product.id) ? (
            <Image
              accessibilityLabel={`Imagen de ${product.title}`}
              onError={() => markImageFailed(product.id)}
              source={{ uri: product.thumbnail }}
              style={styles.thumbnail}
            />
          ) : null}
          <View style={styles.productCopy}>
            <Text style={styles.productTitle}>{product.title}</Text>
            <Text style={styles.productMeta}>{product.category}</Text>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.lg,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: glass.surface,
    borderColor: glass.border,
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 12,
    padding: 12,
    color: colors.textPrimary,
  },
  message: {
    backgroundColor: glass.surface,
    borderColor: glass.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textSecondary,
    fontSize: 16,
    marginVertical: 16,
    overflow: 'hidden',
    padding: spacing.md,
  },
  errorContainer: {
    backgroundColor: glass.surfaceError,
    borderColor: glass.errorBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    marginVertical: 16,
    padding: spacing.md,
  },
  error: {
    color: '#b91c1c',
    marginBottom: 12,
  },
  productCard: {
    alignItems: 'center',
    backgroundColor: glass.surface,
    borderColor: glass.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.sm,
    padding: spacing.md,
    shadowColor: glass.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  thumbnail: {
    height: 72,
    marginRight: 12,
    width: 72,
  },
  productCopy: {
    flex: 1,
  },
  productTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  productMeta: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  price: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  detail: {
    backgroundColor: glass.surface,
    borderColor: glass.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginTop: 20,
    padding: spacing.lg,
    shadowColor: glass.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 5,
  },
  detailImage: {
    alignSelf: 'center',
    height: 220,
    marginBottom: 16,
    width: '100%',
  },
  description: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
  },
});
