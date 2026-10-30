package com.ordercraft.service;

import com.ordercraft.dto.ProductDto;
import com.ordercraft.entity.Product;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllActiveProducts() {
        return productRepository.findByActiveTrue();
    }

    public Page<Product> getProducts(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return productRepository.searchProducts(search.trim(), pageable);
        }
        return productRepository.findAll(pageable);
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    @Transactional
    public Product createProduct(ProductDto dto) {
        if (productRepository.existsByProductCode(dto.getProductCode())) {
            throw new BusinessException("Product with code '" + dto.getProductCode() + "' already exists");
        }

        Product product = new Product(
                dto.getProductCode(),
                dto.getName(),
                dto.getDescription(),
                dto.getUnitOfMeasure(),
                dto.getSellingPrice(),
                dto.getCostPrice()
        );
        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, ProductDto dto) {
        Product product = getProductById(id);

        if (!product.getProductCode().equals(dto.getProductCode()) &&
            productRepository.existsByProductCode(dto.getProductCode())) {
            throw new BusinessException("Product with code '" + dto.getProductCode() + "' already exists");
        }

        product.setProductCode(dto.getProductCode());
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setUnitOfMeasure(dto.getUnitOfMeasure());
        product.setSellingPrice(dto.getSellingPrice());
        product.setCostPrice(dto.getCostPrice());
        product.setActive(dto.isActive());

        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        product.setActive(false);
        productRepository.save(product);
    }
}
