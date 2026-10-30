package com.ordercraft.service;

import com.ordercraft.dto.CustomerDto;
import com.ordercraft.entity.Customer;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.CustomerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public List<Customer> getAllActiveCustomers() {
        return customerRepository.findByActiveTrue();
    }

    public Page<Customer> getCustomers(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return customerRepository.searchCustomers(search.trim(), pageable);
        }
        return customerRepository.findAll(pageable);
    }

    public Customer getCustomerById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
    }

    @Transactional
    public Customer createCustomer(CustomerDto dto) {
        if (customerRepository.existsByCustomerCode(dto.getCustomerCode())) {
            throw new BusinessException("Customer with code '" + dto.getCustomerCode() + "' already exists");
        }

        Customer customer = new Customer(
                dto.getCustomerCode(),
                dto.getName(),
                dto.getEmail(),
                dto.getPhone(),
                dto.getAddress(),
                dto.getTaxId()
        );
        return customerRepository.save(customer);
    }

    @Transactional
    public Customer updateCustomer(Long id, CustomerDto dto) {
        Customer customer = getCustomerById(id);

        if (!customer.getCustomerCode().equals(dto.getCustomerCode()) &&
            customerRepository.existsByCustomerCode(dto.getCustomerCode())) {
            throw new BusinessException("Customer with code '" + dto.getCustomerCode() + "' already exists");
        }

        customer.setCustomerCode(dto.getCustomerCode());
        customer.setName(dto.getName());
        customer.setEmail(dto.getEmail());
        customer.setPhone(dto.getPhone());
        customer.setAddress(dto.getAddress());
        customer.setTaxId(dto.getTaxId());
        customer.setActive(dto.isActive());

        return customerRepository.save(customer);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = getCustomerById(id);
        customer.setActive(false);
        customerRepository.save(customer);
    }
}
