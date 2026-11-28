package com.mellow.backend.status.api;

import org.junit.jupiter.api.Test;
import org.springframework.test.json.JsonCompareMode;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class StatusControllerTest {

    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new StatusController()).build();

    @Test
    void exposesMinimalStatus() throws Exception {
        mvc.perform(get("/api/v1/status"))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                        {"status":"UP","apiVersion":"v1"}
                        """, JsonCompareMode.STRICT));
    }

    @Test
    void rejectsUnsupportedMethod() throws Exception {
        mvc.perform(post("/api/v1/status"))
                .andExpect(status().isMethodNotAllowed());
    }
}
