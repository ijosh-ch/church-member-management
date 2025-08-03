# Church Member Management System Tutorial

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?logo=google&logoColor=white)](https://script.google.com/)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red.svg)](https://github.com/yourusername/church-member-management)

A comprehensive tutorial and implementation guide for building an automated church member management system using Google Forms, Google Sheets, and Google Apps Script.

## Table of Contents

- [Church Member Management System Tutorial](#church-member-management-system-tutorial)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Use Case Diagram](#use-case-diagram)
  - [System Architecture](#system-architecture)
  - [Class Diagram](#class-diagram)
  - [Features](#features)
    - [1. Web Dashboard](#1-web-dashboard)
    - [2. Add Calendar](#2-add-calendar)
    - [3. Generate QR Code](#3-generate-qr-code)
    - [4. Send QR Code to Email](#4-send-qr-code-to-email)

## Overview

This project demonstrates how to build a complete church member management system that:

- **Collects member data** through Google Forms
- **Processes and validates** submissions automatically
- **Manages birthdays** in Google Calendar
- **Generates QR codes** for attendance tracking
- **Sends welcome emails** with personalized content
- **Prevents duplicate** registrations

## Use Case Diagram

```mermaid
graph LR
Actor[Member] --> Register
Actor --> ForgetQRcode

  subgraph Church Member Management System
    ForgetQRcode([Forget QR Code]) --> |include| emailQR

    Register([Register New Member]) --> |include| AddBirthday([Add Birthday to Calendar])
    Register --> |include| emailQR([Send QR Code to Email])
      emailQR --> |include| generateQR([Generate QR Code])

    Register --> |include| addEditURL([Add Edit URL to Spreadsheet])
  end
```

## System Architecture

```mermaid
graph TB
  dashboard[Google Site<br/>**Dashboard**] --> |GET MEMBER| AppScript[Google App Script<br/>API functions]
  Form(Google Form<br/>**Registration**) --> |POST Member| AppScript
  spreadsheet[Google spreadsheet<br/>**Member & Registration DB**] --> |READ Member| AppScript
  attendanceForm[Google Form<br/>**Attendance Forms**] --> |SUBMIT Attendance| spreadsheet[Google spreadsheet<br/>**Member & Attendance DB**]
  
  subgraph Google App Script Workflow
    AppScript --> |CREATE Birthday| birthday[Google Calendar<br/>**Birthday**]
    AppScript --> |CREATE Member| spreadsheet
  end

```

## Class Diagram

```mermaid
classDiagram

class Member{
  - String englishName
  - String chineseName
  - String email
  - Date birthday
  - String phone
  - String iCare
  - String editUrl
}

class Calendar{
  - String title
  - Date date
  - String description

  + createEvent(title: String, date: Date, description: String): void
}

class AttendanceFormFieldsID{
  - String email
  - String name
  - String iCare
  - String location
}

class QRcode{
  - Member member
  - String formURL
  - AttendanceFormFieldsID fieldsID

  - createQRcode(fieldsID: AttendanceFormFieldsID, member: Member): QRcode
}

QRcode "1" --> "1" Member : includes
QRcode "1" --> "1" AttendanceFormFieldsID : includes
```

## Features

### 1. Web Dashboard

```mermaid
flowchart TD
  START((START)) --> NewUser{Register<br>New Member?}
  NewUser --> |Yes| GoogleForm[Open Registration<br/>Google Form]
  GoogleForm --> END
  NewUser --> |No| ForgotPassword[Open<br>Forgot Password Page]
  ForgotPassword --> Email[/Insert email/]
  
  Email --> checkEmail[GET Member from<br/>spreadsheet]
  checkEmail --> emailExists{Member is exists}

  emailExists --> |Yes| sendQRcode[Send attendance<br/>QR code to email]
  emailExists --> |No| displayNotFound[\Display: User not found\]
  displayNotFound --> formSuggestion[Suggest: Open Registration<br/>Google Form]
  formSuggestion --> GoogleForm

  sendQRcode --> END((END))
```

### 2. Add Calendar

```mermaid
flowchart TD
    START((START)) --> CalendarID[Set Calendar by ID]
    CalendarID --> CheckCalendar{Calendar is Exists}
    
    CheckCalendar -->|No| setTitle[Set Event Title & Description]
    CheckCalendar -->|Yes| END
    
    setTitle --> RepeatAnnually[Create Annual Recurrence Event]
    RepeatAnnually --> setAllDay[Create All-Day Event Series]
    
    setAllDay --> addReminders[Add 1-month, 1-week, and 1-day reminders]
    addReminders --> getID(Get Event ID)
    getID --> storeID[Store Event ID to Spreadsheet in column B]
    storeID --> END((END))
```

### 3. Generate QR Code

```mermaid
flowchart TD

start((START)) --> getFieldsID[Get fields ID from Attendance Form]
getFieldsID --> getMember[Get Member data from Form response]
getMember --> getFormURL[Get Attendance Form URL]
getFormURL --> createQrCode[Generate QR Codes from Form URL and Member data mapping with its corresponding fields ID]
createQrCode --> sendEmail[Send QR Code to Member's Email]
sendEmail --> END((END))
```

### 4. Send QR Code to Email

TBC.
