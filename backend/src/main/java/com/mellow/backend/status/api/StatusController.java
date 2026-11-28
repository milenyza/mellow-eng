package com.mellow.backend.status.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class StatusController {

    @GetMapping("/api/v1/status")
    StatusResponse status() {
        return new StatusResponse("UP", "v1");
    }

    record StatusResponse(String status, String apiVersion) {
    }
}
