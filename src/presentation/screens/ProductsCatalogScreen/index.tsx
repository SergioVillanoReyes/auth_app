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
        returnKeyType="search"
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
    paddingBottom: 24,
  },
  heading: {
    color: '#1f2937',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  searchInput: {
    borderColor: '#9ca3af',
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 12,
    padding: 12,
  },
  message: {
    color: '#6b7280',
    fontSize: 16,
    marginVertical: 16,
  },
  errorContainer: {
    marginVertical: 16,
  },
  error: {
    color: '#b91c1c',
    marginBottom: 12,
  },
  productCard: {
    alignItems: 'center',
    borderBottomColor: '#d6dce5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 12,
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
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  productMeta: {
    color: '#6b7280',
    marginTop: 4,
  },
  price: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  detail: {
    marginTop: 20,
  },
  detailImage: {
    alignSelf: 'center',
    height: 220,
    marginBottom: 16,
    width: '100%',
  },
  description: {
    color: '#1f2937',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
  },
});
