import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getProductsDependencies } from '../../../core/di/productsDependencies';
import { Product } from '../../../domain/products/Product';
import { AppButton } from '../../components/AppButton';

export const ProductsCatalogScreen = (): React.JSX.Element => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Set<number>>(
    () => new Set(),
  );
  const listRequestId = useRef(0);
  const detailRequestId = useRef(0);

  const loadProducts = async (query: string): Promise<void> => {
    const requestId = ++listRequestId.current;
    const normalizedQuery = query.trim();
    setSubmittedQuery(normalizedQuery);
    setIsLoading(true);
    setListError(null);

    try {
      const { getProductsUseCase } = getProductsDependencies();
      const result = await getProductsUseCase.execute(normalizedQuery);
      if (requestId === listRequestId.current) {
        setProducts(result);
      }
    } catch {
      if (requestId === listRequestId.current) {
        setListError(
          'No se pudieron cargar los productos. Inténtalo de nuevo.',
        );
      }
    } finally {
      if (requestId === listRequestId.current) {
        setIsLoading(false);
      }
    }
  };

  const loadProductDetail = async (id: number): Promise<void> => {
    const requestId = ++detailRequestId.current;
    setSelectedProductId(id);
    setSelectedProduct(null);
    setIsLoadingDetail(true);
    setDetailError(null);

    try {
      const { getProductByIdUseCase } = getProductsDependencies();
      const product = await getProductByIdUseCase.execute(id);
      if (requestId === detailRequestId.current) {
        setSelectedProduct(product);
      }
    } catch {
      if (requestId === detailRequestId.current) {
        setDetailError('No se pudo cargar el producto. Inténtalo de nuevo.');
      }
    } finally {
      if (requestId === detailRequestId.current) {
        setIsLoadingDetail(false);
      }
    }
  };

  useEffect(() => {
    loadProducts('').then(() => undefined);
    return () => {
      listRequestId.current += 1;
      detailRequestId.current += 1;
    };
  }, []);

  const returnToCatalog = (): void => {
    detailRequestId.current += 1;
    setSelectedProductId(null);
    setSelectedProduct(null);
    setIsLoadingDetail(false);
    setDetailError(null);
  };

  const markImageFailed = (id: number): void => {
    setFailedImageIds(previous => {
      const next = new Set(previous);
      next.add(id);
      return next;
    });
  };

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

  const submitSearch = (): void => {
    loadProducts(searchInput).then(() => undefined);
  };

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
            onPress={() => {
              loadProducts(submittedQuery).then(() => undefined);
            }}
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
