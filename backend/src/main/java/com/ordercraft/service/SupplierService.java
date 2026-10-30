package com.ordercraft.service;

import com.ordercraft.dto.SupplierDto;
import com.ordercraft.entity.Supplier;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.SupplierRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    public List<Supplier> getAllActiveSuppliers() {
        return supplierRepository.findByActiveTrue();
    }

    public Page<Supplier> getSuppliers(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return supplierRepository.searchSuppliers(search.trim(), pageable);
        }
        return supplierRepository.findAll(pageable);
    }

    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));
    }

    @Transactional
    public Supplier createSupplier(SupplierDto dto) {
        if (supplierRepository.existsBySupplierCode(dto.getSupplierCode())) {
            throw new BusinessException("Supplier code '" + dto.getSupplierCode() + "' already exists");
        }

        Supplier supplier = new Supplier(
                dto.getSupplierCode(),
                dto.getName(),
                dto.getContactPerson(),
                dto.getEmail(),
                dto.getPhone(),
                dto.getAddress()
        );
        return supplierRepository.save(supplier);
    }

    @Transactional
    public Supplier updateSupplier(Long id, SupplierDto dto) {
        Supplier supplier = getSupplierById(id);

        if (!supplier.getSupplierCode().equals(dto.getSupplierCode()) &&
            supplierRepository.existsBySupplierCode(dto.getSupplierCode())) {
            throw new BusinessException("Supplier code '" + dto.getSupplierCode() + "' already exists");
        }

        supplier.setSupplierCode(dto.getSupplierCode());
        supplier.setName(dto.getName());
        supplier.setContactPerson(dto.getContactPerson());
        supplier.setEmail(dto.getEmail());
        supplier.setPhone(dto.getPhone());
        supplier.setAddress(dto.getAddress());
        supplier.setActive(dto.isActive());

        return supplierRepository.save(supplier);
    }

    @Transactional
    public void deleteSupplier(Long id) {
        Supplier supplier = getSupplierById(id);
        supplier.setActive(false);
        supplierRepository.save(supplier);
    }
}
