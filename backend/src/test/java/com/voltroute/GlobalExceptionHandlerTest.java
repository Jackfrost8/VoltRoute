package com.voltroute;

import com.voltroute.common.exception.BadRequestException;
import com.voltroute.common.exception.ConflictException;
import com.voltroute.common.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@org.springframework.context.annotation.Import(GlobalExceptionHandlerTest.ExceptionProbeController.class)
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @RestController
    @RequestMapping("/api/auth/test-probe")
    static class ExceptionProbeController {

        @GetMapping("/not-found")
        public void throwNotFound() {
            throw new ResourceNotFoundException("Station", "id", "STA-9999");
        }

        @GetMapping("/bad-request")
        public void throwBadRequest() {
            throw new BadRequestException("Invalid latitude parameter: value must be between -90 and 90");
        }

        @GetMapping("/conflict")
        public void throwConflict() {
            throw new ConflictException("User with email alex@voltroute.internal already exists");
        }

        @PostMapping("/validate")
        public String testValidation(@Valid @RequestBody ValidationTestDto dto) {
            return "Valid: " + dto.getName();
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    static class ValidationTestDto {
        @NotBlank(message = "Name cannot be blank")
        private String name;

        @NotBlank(message = "Email cannot be blank")
        @Email(message = "Invalid email format")
        private String email;
    }

    @Test
    @DisplayName("ResourceNotFoundException should map to HTTP 404 with standard ApiErrorResponse")
    void shouldHandleResourceNotFoundException() throws Exception {
        mockMvc.perform(get("/api/auth/test-probe/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Station not found with id: 'STA-9999'"))
                .andExpect(jsonPath("$.path").value("/api/auth/test-probe/not-found"));
    }

    @Test
    @DisplayName("BadRequestException should map to HTTP 400 with standard ApiErrorResponse")
    void shouldHandleBadRequestException() throws Exception {
        mockMvc.perform(get("/api/auth/test-probe/bad-request"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Invalid latitude parameter: value must be between -90 and 90"));
    }

    @Test
    @DisplayName("ConflictException should map to HTTP 409 with standard ApiErrorResponse")
    void shouldHandleConflictException() throws Exception {
        mockMvc.perform(get("/api/auth/test-probe/conflict"))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("User with email alex@voltroute.internal already exists"));
    }

    @Test
    @DisplayName("MethodArgumentNotValidException should return HTTP 400 with field validation errors")
    void shouldHandleValidationErrors() throws Exception {
        String invalidJson = """
                {
                    "name": "",
                    "email": "not-an-email"
                }
                """;

        mockMvc.perform(post("/api/auth/test-probe/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Validation Failed"))
                .andExpect(jsonPath("$.validationErrors.name").value("Name cannot be blank"))
                .andExpect(jsonPath("$.validationErrors.email").value("Invalid email format"));
    }

    @Test
    @DisplayName("Malformed JSON should return HTTP 400")
    void shouldHandleMalformedJson() throws Exception {
        mockMvc.perform(post("/api/auth/test-probe/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ malformed_json: "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Malformed JSON"));
    }
}
