import { useCallback, useEffect, useRef, useState } from 'react';
import { getProductsDependencies } from '../../core/di/productsDependencies';
import { Product } from '../../domain/products/Product';

export const useProductsCatalog = () => {
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

  const loadProducts = useCallback(async (query: string): Promise<void> => {
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
  }, []);

  const loadProductDetail = useCallback(async (id: number): Promise<void> => {
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
  }, []);

  useEffect(() => {
    loadProducts('').then(() => undefined);
    return () => {
      listRequestId.current += 1;
      detailRequestId.current += 1;
    };
  }, [loadProducts]);

  const submitSearch = (): void => {
    loadProducts(searchInput).then(() => undefined);
  };

  const retryProducts = (): void => {
    loadProducts(submittedQuery).then(() => undefined);
  };

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

  return {
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
  };
};
