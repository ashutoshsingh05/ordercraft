package com.ordercraft.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping(value = {
        "/login",
        "/dashboard",
        "/orders",
        "/customers",
        "/suppliers",
        "/products",
        "/raw-materials",
        "/manufacturing",
        "/purchase-orders",
        "/invoices",
        "/payments",
        "/reports"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
