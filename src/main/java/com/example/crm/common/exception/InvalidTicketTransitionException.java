package com.example.crm.common.exception;

public class InvalidTicketTransitionException extends RuntimeException {
    public InvalidTicketTransitionException(String message) {
        super(message);
    }
}
